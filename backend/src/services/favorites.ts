import { Types } from "mongoose";
import { Event, Favorite } from "../models";
import { HttpError } from "../utils/http";

const eventFields =
  "organizer title slug description category banner startDate endDate venue capacity registeredCount ticketTypes status createdAt updatedAt";

const assertEventId = (eventId: string): void => {
  if (!Types.ObjectId.isValid(eventId))
    throw new HttpError(404, "Event not found");
};

export const getMyFavorites = (userId: string) =>
  Favorite.find({ user: userId })
    .select("user event createdAt updatedAt")
    .populate("event", eventFields)
    .sort({ createdAt: -1 });

export const getFavoriteStatus = async (userId: string, eventId: string) => {
  assertEventId(eventId);
  const eventExists = await Event.exists({ _id: eventId, status: "published" });
  if (!eventExists) throw new HttpError(404, "Event not found");
  return Boolean(await Favorite.exists({ user: userId, event: eventId }));
};

export const addFavorite = async (userId: string, eventId: string) => {
  assertEventId(eventId);
  const eventExists = await Event.exists({ _id: eventId, status: "published" });
  if (!eventExists) throw new HttpError(404, "Event not found");

  try {
    await Favorite.updateOne(
      { user: userId, event: eventId },
      { $setOnInsert: { user: userId, event: eventId } },
      { upsert: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  return Favorite.findOne({ user: userId, event: eventId }).populate(
    "event",
    eventFields,
  );
};

export const removeFavorite = async (userId: string, eventId: string) => {
  assertEventId(eventId);
  await Favorite.deleteOne({ user: userId, event: eventId });
};
