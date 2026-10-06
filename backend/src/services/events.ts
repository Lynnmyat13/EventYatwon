import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import {
  Event,
  Favorite,
  Notification,
  Registration,
  Review,
  type EventStatus,
  type IEvent,
  type IEventVenue,
  type ITicketType,
} from "../models";
import { HttpError } from "../utils/http";
import { deleteImage, EVENT_IMAGE_FOLDER, uploadImage } from "./images";

export interface EventTicketInput {
  name: string;
  price: number;
  quantity: number;
}

export interface EventInput {
  title: string;
  description: string;
  category: string;
  banner?: string | null;
  bannerPublicId?: string;
  startDate: Date;
  endDate: Date;
  venue: IEventVenue;
  capacity: number;
  ticketTypes: EventTicketInput[];
  status?: EventStatus;
}

export interface EventListOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  date?: Date;
  from?: Date;
  to?: Date;
  status?: EventStatus;
  minPrice?: number;
  maxPrice?: number;
  sort: "date" | "newest";
  organizer?: string;
}

const slugify = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180) || "event";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

const nextSlug = async (title: string): Promise<string> => {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  while (await Event.exists({ slug })) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
};

const assertEventId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, "Event not found");
};

const assertCanManage = (event: IEvent, userId: string, role: string): void => {
  if (role !== "admin" && event.organizer.toString() !== userId) {
    throw new HttpError(403, "You do not have permission to manage this event");
  }
};

const notifyEventAttendees = async (
  event: IEvent,
  cancelled = false,
): Promise<void> => {
  const attendeeIds = (await Registration.distinct("user", {
    event: event._id,
    status: "confirmed",
  })) as Types.ObjectId[];
  if (!attendeeIds.length) return;
  await Notification.insertMany(
    attendeeIds.map((attendeeId) => ({
      user: attendeeId,
      event: event._id,
      type: "event_update",
      title: cancelled ? "Event cancelled" : "Event updated",
      message: cancelled
        ? `${event.title} was cancelled.`
        : `Details for ${event.title} were updated.`,
    })),
  );
};

export const listEvents = async (options: EventListOptions) => {
  const filter: Record<string, unknown> = {};

  if (options.organizer) filter.organizer = options.organizer;
  if (options.status) filter.status = options.status;
  if (options.search)
    filter.title = { $regex: escapeRegex(options.search), $options: "i" };
  if (options.category) {
    filter.category = {
      $regex: `^${escapeRegex(options.category)}$`,
      $options: "i",
    };
  }
  if (options.date) {
    const nextDay = new Date(options.date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    filter.startDate = { $lt: nextDay };
    filter.endDate = { $gte: options.date };
  } else if (options.from || options.to) {
    filter.startDate = {
      ...(options.to ? { $lt: options.to } : {}),
    };
    filter.endDate = {
      ...(options.from ? { $gte: options.from } : {}),
    };
  }
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    filter.ticketTypes = {
      $elemMatch: {
        price: {
          ...(options.minPrice === undefined ? {} : { $gte: options.minPrice }),
          ...(options.maxPrice === undefined ? {} : { $lte: options.maxPrice }),
        },
      },
    };
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort(options.sort === "newest" ? { createdAt: -1 } : { startDate: 1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  return {
    events,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const getRecommendedEvents = async (userId: string) => {
  const [registrations, favorites] = await Promise.all([
    Registration.find({
      user: userId,
      status: { $in: ["pending", "confirmed"] },
    })
      .select("event")
      .lean(),
    Favorite.find({ user: userId }).select("event").lean(),
  ]);
  const registeredIds = registrations.map((item) => item.event);
  const preferenceIds = [
    ...registeredIds,
    ...favorites.map((item) => item.event),
  ];
  const preferredCategories = preferenceIds.length
    ? await Event.distinct("category", { _id: { $in: preferenceIds } })
    : [];
  const events = await Event.find({
    status: "published",
    endDate: { $gte: new Date() },
    ...(registeredIds.length ? { _id: { $nin: registeredIds } } : {}),
  })
    .sort({ startDate: 1 })
    .limit(30)
    .lean();
  const categoryOrder = new Map(
    preferredCategories.map((category, index) => [category, index]),
  );

  return events
    .sort((left, right) => {
      const leftRank =
        categoryOrder.get(left.category) ?? Number.MAX_SAFE_INTEGER;
      const rightRank =
        categoryOrder.get(right.category) ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) return leftRank - rightRank;
      if (right.registeredCount !== left.registeredCount)
        return right.registeredCount - left.registeredCount;
      return left.startDate.getTime() - right.startDate.getTime();
    })
    .slice(0, 9);
};

export const getPublicEventStats = async () => {
  const [publishedEvents, registrations, categories, ratings] =
    await Promise.all([
      Event.countDocuments({ status: "published" }),
      Registration.countDocuments({ status: "confirmed" }),
      Event.distinct("category", { status: "published" }),
      Review.aggregate<{ averageRating: number }>([
        { $group: { _id: null, averageRating: { $avg: "$rating" } } },
        {
          $project: {
            _id: 0,
            averageRating: { $round: ["$averageRating", 1] },
          },
        },
      ]),
    ]);

  return {
    publishedEvents,
    registrations,
    categories: categories.sort((left, right) => left.localeCompare(right)),
    averageRating: ratings[0]?.averageRating ?? 0,
  };
};

export const getPublishedEventBySlug = async (slug: string) => {
  const event = await Event.findOne({
    slug: slug.toLowerCase(),
    status: "published",
  })
    .populate("organizer", "name email avatar")
    .lean();
  if (!event) throw new HttpError(404, "Event not found");

  const ticketQuantities = await Registration.aggregate<{
    _id: string;
    quantity: number;
  }>([
    {
      $match: {
        event: event._id,
        status: { $in: ["pending", "confirmed"] },
      },
    },
    { $group: { _id: "$ticketType", quantity: { $sum: "$quantity" } } },
  ]);
  const quantities = new Map(
    ticketQuantities.map((ticket) => [ticket._id, ticket.quantity]),
  );

  return {
    ...event,
    registeredCount: ticketQuantities.reduce(
      (total, ticket) => total + ticket.quantity,
      0,
    ),
    ticketTypes: event.ticketTypes.map((ticket: ITicketType) => ({
      ...ticket,
      sold: quantities.get(ticket.name) ?? 0,
    })),
  };
};

export const createEvent = async (organizer: string, input: EventInput) => {
  const slug = await nextSlug(input.title);

  try {
    return await Event.create({ ...input, organizer, slug });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return Event.create({
      ...input,
      organizer,
      slug: `${slug}-${randomUUID().slice(0, 8)}`,
    });
  }
};

export const updateEvent = async (
  id: string,
  userId: string,
  role: string,
  input: Partial<EventInput>,
) => {
  assertEventId(id);
  const event = await Event.findById(id).select("+bannerPublicId");
  if (!event) throw new HttpError(404, "Event not found");
  assertCanManage(event, userId, role);

  const wasCancelled = event.status === "cancelled";
  const venueChanged =
    input.venue !== undefined &&
    (input.venue.name !== event.venue.name ||
      input.venue.address !== event.venue.address);
  const ticketTypesChanged =
    input.ticketTypes !== undefined &&
    JSON.stringify(input.ticketTypes) !==
      JSON.stringify(
        event.ticketTypes.map((ticket: ITicketType) => ({
          name: ticket.name,
          price: ticket.price,
          quantity: ticket.quantity,
        })),
      );
  const detailsChanged =
    (input.title !== undefined && input.title !== event.title) ||
    (input.description !== undefined &&
      input.description !== event.description) ||
    (input.category !== undefined && input.category !== event.category) ||
    (input.banner !== undefined && input.banner !== event.banner) ||
    (input.startDate !== undefined &&
      input.startDate.getTime() !== event.startDate.getTime()) ||
    (input.endDate !== undefined &&
      input.endDate.getTime() !== event.endDate.getTime()) ||
    (input.capacity !== undefined && input.capacity !== event.capacity) ||
    venueChanged ||
    ticketTypesChanged;
  const cancelled = input.status === "cancelled" && !wasCancelled;
  const previousBannerPublicId = event.bannerPublicId;

  const nextInput = { ...input } as Partial<EventInput> & {
    ticketTypes?: Array<EventTicketInput & { sold: number }>;
  };
  if (input.ticketTypes) {
    const missingSoldTicket = event.ticketTypes.find(
      (current: ITicketType) =>
        current.sold > 0 &&
        !input.ticketTypes?.some(
          (ticketType) => ticketType.name === current.name,
        ),
    );
    if (missingSoldTicket) {
      throw new HttpError(
        409,
        "Ticket types with registrations cannot be removed or renamed",
      );
    }

    nextInput.ticketTypes = input.ticketTypes.map((ticketType) => ({
      ...ticketType,
      sold:
        event.ticketTypes.find(
          (current: ITicketType) => current.name === ticketType.name,
        )?.sold ?? 0,
    }));
  }

  if (input.venue) {
    event.venue.name = input.venue.name;
    event.venue.address = input.venue.address;
    delete nextInput.venue;
  }
  if (input.banner !== undefined && input.bannerPublicId === undefined) {
    event.bannerPublicId = undefined;
  }

  Object.assign(event, nextInput);
  const savedEvent = await event.save();

  if (
    previousBannerPublicId &&
    previousBannerPublicId !== savedEvent.bannerPublicId
  ) {
    await deleteImage(previousBannerPublicId, EVENT_IMAGE_FOLDER);
  }

  if (cancelled || detailsChanged) {
    await notifyEventAttendees(savedEvent, cancelled);
  }

  return savedEvent;
};

export const deleteEvent = async (
  id: string,
  userId: string,
  role: string,
): Promise<void> => {
  assertEventId(id);
  const event = await Event.findById(id).select("+bannerPublicId");
  if (!event) throw new HttpError(404, "Event not found");
  assertCanManage(event, userId, role);
  if (role !== "admin" && event.status !== "draft") {
    throw new HttpError(409, "Only draft events can be deleted");
  }
  await event.deleteOne();
  await deleteImage(event.bannerPublicId, EVENT_IMAGE_FOLDER);
};

export const replaceEventBanner = async (
  id: string,
  userId: string,
  role: string,
  image: Buffer,
) => {
  assertEventId(id);
  const event = await Event.findById(id).select("+bannerPublicId");
  if (!event) throw new HttpError(404, "Event not found");
  assertCanManage(event, userId, role);

  const uploaded = await uploadImage(image, EVENT_IMAGE_FOLDER);
  const previousPublicId = event.bannerPublicId;
  event.banner = uploaded.secureUrl;
  event.bannerPublicId = uploaded.publicId;
  try {
    await event.save();
  } catch (error) {
    await deleteImage(uploaded.publicId, EVENT_IMAGE_FOLDER);
    throw error;
  }
  await deleteImage(previousPublicId, EVENT_IMAGE_FOLDER);
  await notifyEventAttendees(event);
  return event;
};

export const removeEventBanner = async (
  id: string,
  userId: string,
  role: string,
) => {
  assertEventId(id);
  const event = await Event.findById(id).select("+bannerPublicId");
  if (!event) throw new HttpError(404, "Event not found");
  assertCanManage(event, userId, role);

  const previousPublicId = event.bannerPublicId;
  event.banner = undefined;
  event.bannerPublicId = undefined;
  const saved = await event.save();
  await deleteImage(previousPublicId, EVENT_IMAGE_FOLDER);
  await notifyEventAttendees(saved);
  return saved;
};
