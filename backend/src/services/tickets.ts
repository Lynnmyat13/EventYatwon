import { Types } from "mongoose";
import {
  Event,
  Notification,
  Ticket,
  User,
  type ITicket,
  type UserRole,
} from "../models";
import { HttpError } from "../utils/http";

const ticketFields =
  "registration event user ticketCode ticketType checkedIn checkedInAt status createdAt updatedAt";
const eventFields =
  "organizer title slug banner startDate endDate venue status category";

const assertObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, "Ticket not found");
};

const ticketQuery = (
  filter: Partial<Record<keyof ITicket, unknown>>,
  includeQrToken: boolean,
) =>
  Ticket.find(filter)
    .select(`${ticketFields}${includeQrToken ? " +qrToken" : ""}`)
    .populate("event", eventFields);

export const getMyTickets = (userId: string) =>
  ticketQuery({ user: userId, archivedByUser: { $ne: true } }, true).sort({
    createdAt: -1,
  });

export const getTicketById = async (
  userId: string,
  role: UserRole,
  ticketId: string,
) => {
  assertObjectId(ticketId);
  const accessTicket = await Ticket.findById(ticketId).select(
    "user event archivedByUser",
  );
  if (!accessTicket) throw new HttpError(404, "Ticket not found");

  const isOwner = accessTicket.user.toString() === userId;
  const isAdmin = role === "admin";
  const isEventOrganizer =
    role === "organizer" &&
    Boolean(await Event.exists({ _id: accessTicket.event, organizer: userId }));

  if (!isOwner && !isAdmin && !isEventOrganizer) {
    throw new HttpError(404, "Ticket not found");
  }
  if (isOwner && accessTicket.archivedByUser) {
    throw new HttpError(404, "Ticket not found");
  }

  const [ticket] = await ticketQuery({ _id: ticketId }, isOwner);
  if (!ticket) throw new HttpError(404, "Ticket not found");
  return ticket;
};

export const archiveCancelledTicket = async (
  userId: string,
  ticketId: string,
) => {
  assertObjectId(ticketId);
  const ticket = await Ticket.findOne({ _id: ticketId, user: userId });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  if (ticket.status !== "cancelled") {
    throw new HttpError(409, "Only cancelled tickets can be removed");
  }

  ticket.archivedByUser = true;
  await ticket.save();
};

export interface CheckInCredential {
  qrToken?: string;
  ticketCode?: string;
}

export const checkInTicket = async (
  eventId: string,
  userId: string,
  role: UserRole,
  credential: CheckInCredential,
) => {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new HttpError(404, "Event not found", "EVENT_NOT_FOUND");
  }

  const event = await Event.findById(eventId).select("organizer title slug");
  if (!event) throw new HttpError(404, "Event not found", "EVENT_NOT_FOUND");
  if (role !== "admin" && event.organizer.toString() !== userId) {
    throw new HttpError(
      403,
      "You do not have permission to check in tickets for this event",
      "CHECK_IN_FORBIDDEN",
    );
  }

  const manualCode = credential.ticketCode?.trim();
  const filter = credential.qrToken
    ? { qrToken: credential.qrToken }
    : manualCode && Types.ObjectId.isValid(manualCode)
      ? { _id: manualCode }
      : { ticketCode: manualCode?.toUpperCase() };
  const candidate = await Ticket.findOne(filter).select(
    "event user status checkedIn ticketCode ticketType",
  );
  if (!candidate) {
    throw new HttpError(404, "Ticket not found", "TICKET_NOT_FOUND");
  }
  if (candidate.event.toString() !== eventId) {
    throw new HttpError(
      409,
      "Ticket does not belong to this event",
      "WRONG_EVENT",
    );
  }
  if (candidate.checkedIn || candidate.status === "used") {
    throw new HttpError(
      409,
      "Ticket has already been checked in",
      "ALREADY_CHECKED_IN",
    );
  }
  if (candidate.status === "cancelled") {
    throw new HttpError(409, "Ticket is cancelled", "TICKET_CANCELLED");
  }
  if (candidate.status !== "active") {
    throw new HttpError(409, "Ticket is not active", "TICKET_INACTIVE");
  }

  const checkedInTicket = await Ticket.findOneAndUpdate(
    {
      _id: candidate._id,
      event: eventId,
      status: "active",
      checkedIn: false,
    },
    {
      $set: {
        status: "used",
        checkedIn: true,
        checkedInAt: new Date(),
      },
    },
    { returnDocument: "after" },
  ).select("user ticketCode ticketType status checkedIn checkedInAt");

  if (!checkedInTicket) {
    throw new HttpError(
      409,
      "Ticket has already been checked in",
      "ALREADY_CHECKED_IN",
    );
  }

  const attendee = await User.findById(checkedInTicket.user)
    .select("name avatar -_id")
    .lean();

  await Notification.create({
    user: checkedInTicket.user,
    event: event._id,
    type: "ticket",
    title: "Ticket checked in",
    message: `${checkedInTicket.ticketCode} was checked in for ${event.title}.`,
  });

  return {
    event: { title: event.title, slug: event.slug },
    attendee: {
      name: attendee?.name ?? "Attendee",
      avatar: attendee?.avatar ?? null,
    },
    ticketCode: checkedInTicket.ticketCode,
    ticketType: checkedInTicket.ticketType,
    status: checkedInTicket.status,
    checkedIn: checkedInTicket.checkedIn,
    checkedInAt: checkedInTicket.checkedInAt,
  };
};
