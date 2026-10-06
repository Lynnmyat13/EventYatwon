import type { NextFunction, Request, Response } from "express";
import type { EventStatus } from "../models";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  createEvent as createEventRecord,
  deleteEvent as deleteEventRecord,
  getPublishedEventBySlug,
  getPublicEventStats,
  getRecommendedEvents as getRecommendedEventRecords,
  listEvents,
  removeEventBanner as removeEventBannerRecord,
  replaceEventBanner as replaceEventBannerRecord,
  updateEvent as updateEventRecord,
  type EventInput,
  type EventListOptions,
  type EventTicketInput,
} from "../services/events";
import {
  deleteImage,
  EVENT_IMAGE_FOLDER,
  uploadImage,
} from "../services/images";
import { HttpError, sendSuccess } from "../utils/http";

const EVENT_STATUSES: EventStatus[] = [
  "draft",
  "pending",
  "published",
  "completed",
  "cancelled",
];

const bodyObject = (req: Request): Record<string, unknown> => {
  if (typeof req.body?.payload === "string") {
    try {
      const payload = JSON.parse(req.body.payload) as unknown;
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        throw new Error();
      return payload as Record<string, unknown>;
    } catch {
      throw new HttpError(400, "Event payload must be valid JSON");
    }
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new HttpError(400, "Request body must be an object");
  }
  return req.body as Record<string, unknown>;
};

const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} is required`);
  }
  return value.trim();
};

const dateValue = (value: unknown, field: string): Date => {
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new HttpError(400, `${field} must be a valid date`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new HttpError(400, `${field} must be a valid date`);
  return date;
};

const numberValue = (
  value: unknown,
  field: string,
  integer = false,
): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (integer && !Number.isInteger(value))
  ) {
    throw new HttpError(
      400,
      `${field} must be a valid${integer ? " whole" : ""} number`,
    );
  }
  return value;
};

const parseVenue = (value: unknown): EventInput["venue"] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "venue is required");
  }
  const venue = value as Record<string, unknown>;

  return {
    name: requiredString(venue.name, "venue.name"),
    address: requiredString(venue.address, "venue.address"),
  };
};

const parseTicketTypes = (value: unknown): EventTicketInput[] => {
  if (!Array.isArray(value))
    throw new HttpError(400, "ticketTypes must be an array");

  return value.map((ticket, index) => {
    if (!ticket || typeof ticket !== "object" || Array.isArray(ticket)) {
      throw new HttpError(400, `ticketTypes[${index}] must be an object`);
    }
    const item = ticket as Record<string, unknown>;
    const price = numberValue(item.price, `ticketTypes[${index}].price`);
    const quantity = numberValue(
      item.quantity,
      `ticketTypes[${index}].quantity`,
      true,
    );
    if (price < 0 || quantity < 0) {
      throw new HttpError(400, "Ticket price and quantity cannot be negative");
    }
    return {
      name: requiredString(item.name, `ticketTypes[${index}].name`),
      price,
      quantity,
    };
  });
};

const parseStatus = (value: unknown): EventStatus => {
  if (
    typeof value !== "string" ||
    !EVENT_STATUSES.includes(value as EventStatus)
  ) {
    throw new HttpError(400, "Invalid event status");
  }
  return value as EventStatus;
};

const parseEventInput = (
  body: Record<string, unknown>,
  partial: boolean,
): Partial<EventInput> => {
  const input: Partial<EventInput> = {};

  if (!partial || body.title !== undefined)
    input.title = requiredString(body.title, "title");
  if (!partial || body.description !== undefined) {
    input.description = requiredString(body.description, "description");
  }
  if (!partial || body.category !== undefined)
    input.category = requiredString(body.category, "category");
  if (body.banner !== undefined) {
    if (body.banner !== null && typeof body.banner !== "string") {
      throw new HttpError(400, "banner must be a string or null");
    }
    input.banner = typeof body.banner === "string" ? body.banner.trim() : null;
  }
  if (!partial || body.startDate !== undefined)
    input.startDate = dateValue(body.startDate, "startDate");
  if (!partial || body.endDate !== undefined)
    input.endDate = dateValue(body.endDate, "endDate");
  if (!partial || body.venue !== undefined)
    input.venue = parseVenue(body.venue);
  if (!partial || body.capacity !== undefined) {
    const capacity = numberValue(body.capacity, "capacity", true);
    if (capacity < 1) throw new HttpError(400, "capacity must be at least 1");
    input.capacity = capacity;
  }
  if (!partial || body.ticketTypes !== undefined)
    input.ticketTypes = parseTicketTypes(body.ticketTypes ?? []);
  if (body.status !== undefined) input.status = parseStatus(body.status);

  if (partial && Object.keys(input).length === 0) {
    throw new HttpError(400, "At least one editable event field is required");
  }
  return input;
};

const queryString = (value: unknown, field: string): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string")
    throw new HttpError(400, `${field} must be a single value`);
  return value.trim() || undefined;
};

const routeParam = (value: string | string[] | undefined): string => {
  if (typeof value !== "string" || !value)
    throw new HttpError(404, "Event not found");
  return value;
};

const queryNumber = (value: unknown, field: string): number | undefined => {
  const raw = queryString(value, field);
  if (raw === undefined) return undefined;
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0)
    throw new HttpError(400, `${field} must be non-negative`);
  return number;
};

const listOptions = (req: Request, organizer?: string): EventListOptions => {
  const page = Number(queryString(req.query.page, "page") ?? 1);
  const limit = Number(queryString(req.query.limit, "limit") ?? 12);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new HttpError(
      400,
      "page and limit must be positive whole numbers, with limit at most 100",
    );
  }

  const dateRaw = queryString(req.query.date, "date");
  let date: Date | undefined;
  if (dateRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw))
      throw new HttpError(400, "date must use YYYY-MM-DD");
    date = new Date(`${dateRaw}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
      throw new HttpError(400, "date must be valid");
  }

  const rangeDate = (value: unknown, field: string): Date | undefined => {
    const raw = queryString(value, field);
    if (!raw) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw))
      throw new HttpError(400, `${field} must use YYYY-MM-DD`);
    const parsed = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()))
      throw new HttpError(400, `${field} must be valid`);
    return parsed;
  };
  const from = rangeDate(req.query.from, "from");
  const toDate = rangeDate(req.query.to, "to");
  const to = toDate
    ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000)
    : undefined;
  if (from && to && from >= to)
    throw new HttpError(400, "from must be before or equal to to");

  const sort = queryString(req.query.sort, "sort") ?? "date";
  if (sort !== "date" && sort !== "newest")
    throw new HttpError(400, "sort must be date or newest");
  const minPrice = queryNumber(req.query.minPrice, "minPrice");
  const maxPrice = queryNumber(req.query.maxPrice, "maxPrice");
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new HttpError(400, "minPrice cannot exceed maxPrice");
  }

  const statusRaw = queryString(req.query.status, "status");
  return {
    page,
    limit,
    search: queryString(req.query.search, "search"),
    category: queryString(req.query.category, "category"),
    date,
    from,
    to,
    status: organizer
      ? statusRaw
        ? parseStatus(statusRaw)
        : undefined
      : "published",
    minPrice,
    maxPrice,
    sort,
    organizer,
  };
};

export const getRecommendedEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authDetails(req);
    sendSuccess(res, 200, "Recommended events retrieved", {
      events: await getRecommendedEventRecords(auth.userId),
    });
  } catch (error) {
    next(error);
  }
};

const authDetails = (req: Request) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new HttpError(401, "Authentication required");
  return auth;
};

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(
      res,
      200,
      "Events retrieved",
      await listEvents(listOptions(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const getEventStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(res, 200, "Event statistics retrieved", {
      stats: await getPublicEventStats(),
    });
  } catch (error) {
    next(error);
  }
};

export const getEventBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const event = await getPublishedEventBySlug(routeParam(req.params.slug));
    sendSuccess(res, 200, "Event retrieved", { event });
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authDetails(req);
    sendSuccess(
      res,
      200,
      "Organizer events retrieved",
      await listEvents(listOptions(req, auth.userId)),
    );
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let uploaded: Awaited<ReturnType<typeof uploadImage>> | undefined;
  try {
    const auth = authDetails(req);
    const input = parseEventInput(bodyObject(req), false) as EventInput;
    if (req.file) {
      uploaded = await uploadImage(req.file.buffer, EVENT_IMAGE_FOLDER);
      input.banner = uploaded.secureUrl;
      input.bannerPublicId = uploaded.publicId;
    }
    const event = await createEventRecord(auth.userId, input);
    uploaded = undefined;
    sendSuccess(res, 201, "Event created", { event });
  } catch (error) {
    if (uploaded) await deleteImage(uploaded.publicId, EVENT_IMAGE_FOLDER);
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authDetails(req);
    const event = await updateEventRecord(
      routeParam(req.params.id),
      auth.userId,
      auth.role,
      parseEventInput(bodyObject(req), true),
    );
    sendSuccess(res, 200, "Event updated", { event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authDetails(req);
    await deleteEventRecord(routeParam(req.params.id), auth.userId, auth.role);
    sendSuccess(res, 200, "Event deleted");
  } catch (error) {
    next(error);
  }
};

export const replaceEventBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) throw new HttpError(400, "Banner image is required");
    const auth = authDetails(req);
    const event = await replaceEventBannerRecord(
      routeParam(req.params.id),
      auth.userId,
      auth.role,
      req.file.buffer,
    );
    sendSuccess(res, 200, "Event banner updated", { event });
  } catch (error) {
    next(error);
  }
};

export const removeEventBanner = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authDetails(req);
    const event = await removeEventBannerRecord(
      routeParam(req.params.id),
      auth.userId,
      auth.role,
    );
    sendSuccess(res, 200, "Event banner removed", { event });
  } catch (error) {
    next(error);
  }
};
