import { Types } from "mongoose";
import { Event, User } from "../models";
import { HttpError } from "../utils/http";

export const getPublicOrganizer = async (id: string) => {
  if (!Types.ObjectId.isValid(id))
    throw new HttpError(404, "Organizer not found");

  const organizer = await User.findOne({
    _id: id,
    role: "organizer",
    isActive: true,
  })
    .select("name avatar createdAt")
    .lean();
  if (!organizer) throw new HttpError(404, "Organizer not found");

  const [events, totals] = await Promise.all([
    Event.find({ organizer: id, status: "published" })
      .sort({ startDate: 1 })
      .limit(24)
      .lean(),
    Event.aggregate<{
      publishedEvents: number;
      registrations: number;
    }>([
      {
        $match: {
          organizer: new Types.ObjectId(id),
          status: "published",
        },
      },
      {
        $group: {
          _id: null,
          publishedEvents: { $sum: 1 },
          registrations: { $sum: "$registeredCount" },
        },
      },
    ]),
  ]);

  return {
    organizer: {
      ...organizer,
      createdAt: organizer.createdAt ?? organizer._id.getTimestamp(),
    },
    events,
    stats: totals[0] ?? { publishedEvents: 0, registrations: 0 },
  };
};
