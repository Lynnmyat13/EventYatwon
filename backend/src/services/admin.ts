import { Types } from "mongoose";
import {
  Event,
  Registration,
  Ticket,
  User,
  type EventStatus,
  type UserRole,
} from "../models";
import { updateEvent } from "./events";
import { HttpError } from "../utils/http";

export interface AdminListOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface AdminUserListOptions extends AdminListOptions {
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminEventListOptions extends AdminListOptions {
  status?: EventStatus;
  category?: string;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const pagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const validId = (id: string, resource: string): void => {
  if (!Types.ObjectId.isValid(id))
    throw new HttpError(404, `${resource} not found`);
};

export const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalOrganizers,
    totalAttendees,
    totalEvents,
    totalRegistrations,
    totalTickets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "organizer" }),
    User.countDocuments({ role: "attendee" }),
    Event.countDocuments(),
    Registration.countDocuments(),
    Ticket.countDocuments(),
  ]);

  const [users, events, registrations, tickets] = await Promise.all([
    User.find()
      .select("name role createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Event.find()
      .select("title slug status createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Registration.find()
      .select("event status createdAt")
      .populate("event", "title slug")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Ticket.find()
      .select("event status checkedIn checkedInAt createdAt updatedAt")
      .populate("event", "title slug")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const activity = [
    ...users.map((user) => ({
      id: `user-${user._id}`,
      type: "user" as const,
      message: `${user.name} joined as ${user.role}`,
      createdAt: user.createdAt,
    })),
    ...events.map((event) => ({
      id: `event-${event._id}`,
      type: "event" as const,
      message: `${event.title} was created`,
      event: { id: event._id, title: event.title, slug: event.slug },
      createdAt: event.createdAt,
    })),
    ...registrations.map((registration) => {
      const event = registration.event as unknown as {
        _id: Types.ObjectId;
        title: string;
        slug: string;
      } | null;
      return {
        id: `registration-${registration._id}`,
        type: "registration" as const,
        message: event
          ? `New registration for ${event.title}`
          : "New registration",
        ...(event
          ? { event: { id: event._id, title: event.title, slug: event.slug } }
          : {}),
        createdAt: registration.createdAt,
      };
    }),
    ...tickets.map((ticket) => {
      const event = ticket.event as unknown as {
        _id: Types.ObjectId;
        title: string;
        slug: string;
      } | null;
      return {
        id: `ticket-${ticket._id}`,
        type: "ticket" as const,
        message: ticket.checkedIn
          ? event
            ? `Ticket checked in for ${event.title}`
            : "Ticket checked in"
          : event
            ? `Ticket issued for ${event.title}`
            : "Ticket issued",
        ...(event
          ? { event: { id: event._id, title: event.title, slug: event.slug } }
          : {}),
        createdAt: ticket.checkedInAt ?? ticket.createdAt,
      };
    }),
  ]
    .filter(({ createdAt }) => isValidDate(createdAt))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 10);

  return {
    summary: {
      totalUsers,
      totalOrganizers,
      totalAttendees,
      totalEvents,
      totalRegistrations,
      totalTickets,
    },
    activity,
  };
};

export const listAdminUsers = async (options: AdminUserListOptions) => {
  const filter: Record<string, unknown> = {};
  if (options.search) {
    const pattern = { $regex: escapeRegex(options.search), $options: "i" };
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (options.role) filter.role = options.role;
  if (options.isActive !== undefined) filter.isActive = options.isActive;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email avatar role isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { users, pagination: pagination(options.page, options.limit, total) };
};

export const getAdminUser = async (id: string) => {
  validId(id, "User");
  const user = await User.findById(id)
    .select("name email avatar role isActive createdAt updatedAt")
    .lean();
  if (!user) throw new HttpError(404, "User not found");
  const [registrations, tickets, organizedEvents] = await Promise.all([
    Registration.countDocuments({ user: id }),
    Ticket.countDocuments({ user: id }),
    Event.countDocuments({ organizer: id }),
  ]);
  return { ...user, stats: { registrations, tickets, organizedEvents } };
};

export const setAdminUserStatus = async (
  id: string,
  adminId: string,
  isActive: boolean,
) => {
  validId(id, "User");
  if (id === adminId && !isActive)
    throw new HttpError(400, "You cannot deactivate your own account");
  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { returnDocument: "after", runValidators: true },
  )
    .select("name email avatar role isActive createdAt updatedAt")
    .lean();
  if (!user) throw new HttpError(404, "User not found");
  return user;
};

export const listAdminEvents = async (options: AdminEventListOptions) => {
  const filter: Record<string, unknown> = {};
  if (options.search)
    filter.title = { $regex: escapeRegex(options.search), $options: "i" };
  if (options.status) filter.status = options.status;
  if (options.category) filter.category = options.category;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .select(
        "organizer title slug category banner startDate endDate venue capacity registeredCount status createdAt",
      )
      .populate("organizer", "name email")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Event.countDocuments(filter),
  ]);
  return { events, pagination: pagination(options.page, options.limit, total) };
};

export const cancelAdminEvent = async (id: string, adminId: string) => {
  validId(id, "Event");
  const event = await Event.findById(id).select("status");
  if (!event) throw new HttpError(404, "Event not found");
  if (event.status === "cancelled")
    throw new HttpError(409, "Event is already cancelled");
  return updateEvent(id, adminId, "admin", { status: "cancelled" });
};

export const listAdminCategories = async () =>
  Event.aggregate<{
    name: string;
    totalEvents: number;
    publishedEvents: number;
  }>([
    {
      $group: {
        _id: "$category",
        totalEvents: { $sum: 1 },
        publishedEvents: {
          $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
        },
      },
    },
    { $project: { _id: 0, name: "$_id", totalEvents: 1, publishedEvents: 1 } },
    { $sort: { name: 1 } },
  ]);
