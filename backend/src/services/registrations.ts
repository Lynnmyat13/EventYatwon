import mongoose, { Types } from "mongoose";
import {
  Event,
  Notification,
  Registration,
  Ticket,
  type IEvent,
  type ITicketType,
} from "../models";
import { HttpError } from "../utils/http";

const eventFields =
  "title slug banner startDate endDate venue status category capacity registeredCount ticketTypes";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

const assertObjectId = (id: string, resource: string): void => {
  if (!Types.ObjectId.isValid(id))
    throw new HttpError(404, `${resource} not found`);
};

const synchronizeEventRegistrationCounts = async (
  event: IEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  const counts = await Registration.aggregate<{
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
  ]).session(session);
  const quantities = new Map(counts.map((item) => [item._id, item.quantity]));

  event.registeredCount = counts.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  for (const ticket of event.ticketTypes) {
    ticket.sold = quantities.get(ticket.name) ?? 0;
  }
};

export const createRegistration = async (
  userId: string,
  eventId: string,
  ticketType: string,
  quantity: number,
) => {
  assertObjectId(eventId, "Event");
  const session = await mongoose.startSession();
  let registrationId: string | null = null;

  try {
    registrationId = await session.withTransaction(async () => {
      const existingRegistration = await Registration.findOne({
        user: userId,
        event: eventId,
      }).session(session);
      if (
        existingRegistration &&
        existingRegistration.status !== "cancelled" &&
        existingRegistration.status !== "refunded"
      ) {
        throw new HttpError(409, "You are already registered for this event");
      }

      const event = await Event.findById(eventId).session(session);
      if (!event) throw new HttpError(404, "Event not found");
      if (event.status === "cancelled")
        throw new HttpError(409, "Event is cancelled");
      if (event.status !== "published") {
        throw new HttpError(409, "Event is not open for registration");
      }
      if (event.endDate <= new Date())
        throw new HttpError(409, "Event registration has expired");

      const selectedTicket = event.ticketTypes.find(
        (ticket: ITicketType) => ticket.name === ticketType,
      );
      if (!selectedTicket) throw new HttpError(400, "Invalid ticket type");
      if (selectedTicket.quantity - selectedTicket.sold < quantity) {
        throw new HttpError(409, "Requested ticket quantity is not available");
      }
      if (event.capacity - event.registeredCount < quantity) {
        throw new HttpError(409, "Event capacity would be exceeded");
      }

      selectedTicket.sold += quantity;
      event.registeredCount += quantity;
      await event.save({ session });

      let registration = existingRegistration;
      if (registration) {
        registration.ticketType = ticketType;
        registration.quantity = quantity;
        registration.status = "confirmed";
        registration.archivedByUser = false;
        registration.registeredAt = new Date();
        await registration.save({ session });
      } else {
        [registration] = await Registration.create(
          [
            {
              user: userId,
              event: eventId,
              ticketType,
              quantity,
              status: "confirmed",
              registeredAt: new Date(),
            },
          ],
          { session, ordered: true },
        );
      }

      await Ticket.create(
        Array.from({ length: quantity }, () => ({
          registration: registration._id,
          event: event._id,
          user: userId,
          ticketType,
          status: "active",
          checkedIn: false,
          checkedInAt: null,
        })),
        { session, ordered: true },
      );
      await Notification.create(
        [
          {
            user: userId,
            event: event._id,
            type: "registration",
            title: "Registration confirmed",
            message: `You registered for ${event.title}.`,
          },
        ],
        { session, ordered: true },
      );
      return registration.id as string;
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "You are already registered for this event");
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (!registrationId)
    throw new Error("Registration transaction completed without a result");
  return Registration.findById(registrationId).populate("event", eventFields);
};

export const getMyRegistrations = async (userId: string) =>
  Registration.find({ user: userId, archivedByUser: { $ne: true } })
    .populate("event", eventFields)
    .sort({ registeredAt: -1 });

export const getRegistrationById = async (userId: string, id: string) => {
  assertObjectId(id, "Registration");
  const registration = await Registration.findOne({
    _id: id,
    user: userId,
    archivedByUser: { $ne: true },
  }).populate("event", eventFields);
  if (!registration) throw new HttpError(404, "Registration not found");
  return registration;
};

export const archiveCancelledRegistration = async (
  userId: string,
  id: string,
) => {
  assertObjectId(id, "Registration");
  const registration = await Registration.findOne({ _id: id, user: userId });
  if (!registration) throw new HttpError(404, "Registration not found");

  const eventIsCancelled = await Event.exists({
    _id: registration.event,
    status: "cancelled",
  });
  if (
    registration.status !== "cancelled" &&
    registration.status !== "refunded" &&
    !eventIsCancelled
  ) {
    throw new HttpError(409, "Only cancelled registrations can be removed");
  }

  registration.archivedByUser = true;
  await registration.save();
};

export const cancelRegistration = async (userId: string, id: string) => {
  assertObjectId(id, "Registration");
  const session = await mongoose.startSession();
  let registrationId: string | null = null;

  try {
    registrationId = await session.withTransaction(async () => {
      const registration = await Registration.findOne({
        _id: id,
        user: userId,
      }).session(session);
      if (!registration) throw new HttpError(404, "Registration not found");

      if (
        registration.status === "cancelled" ||
        registration.status === "refunded"
      ) {
        throw new HttpError(409, "Registration is already cancelled");
      }

      const event = await Event.findById(registration.event).session(session);
      if (event) {
        if (event.startDate <= new Date()) {
          throw new HttpError(
            409,
            "Registration cannot be cancelled after the event has started",
          );
        }
      }

      registration.status = "cancelled";
      await registration.save({ session });
      if (event) {
        await synchronizeEventRegistrationCounts(event, session);
        await event.save({ session });
      }
      await Ticket.updateMany(
        { registration: registration._id },
        { $set: { status: "cancelled", checkedIn: false, checkedInAt: null } },
        { session },
      );
      await Notification.create(
        [
          {
            user: userId,
            event: registration.event,
            type: "registration",
            title: "Registration cancelled",
            message: event
              ? `Your registration for ${event.title} was cancelled.`
              : "Your registration was cancelled.",
          },
        ],
        { session, ordered: true },
      );
      return registration.id as string;
    });
  } finally {
    await session.endSession();
  }

  if (!registrationId)
    throw new Error("Cancellation transaction completed without a result");
  return Registration.findById(registrationId).populate("event", eventFields);
};
