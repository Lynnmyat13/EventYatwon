import { Types } from "mongoose";
import { Event, Registration, Review, type UserRole } from "../models";
import { HttpError } from "../utils/http";

const assertObjectId = (id: string, resource: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, `${resource} not found`);
  }
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const createReview = async (
  userId: string,
  eventId: string,
  rating: number,
  comment: string,
) => {
  assertObjectId(eventId, "Event");
  const event = await Event.findById(eventId).select("endDate");
  if (!event) throw new HttpError(404, "Event not found");
  if (event.endDate > new Date()) {
    throw new HttpError(409, "Reviews are available after the event ends");
  }
  const registered = await Registration.exists({
    user: userId,
    event: eventId,
    status: "confirmed",
  });
  if (!registered) {
    throw new HttpError(403, "Only registered attendees can review this event");
  }

  try {
    const review = await Review.create({
      user: userId,
      event: eventId,
      rating,
      comment,
    });
    return review.populate("user", "name avatar");
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "You have already reviewed this event");
    }
    throw error;
  }
};

export const getEventReviews = async (
  eventId: string,
  auth: { userId: string; role: UserRole } | undefined,
  page: number,
  limit: number,
) => {
  assertObjectId(eventId, "Event");
  const event = await Event.findById(eventId).select("endDate").lean();
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  const [reviews, myReview, summary, confirmedRegistration] = await Promise.all(
    [
      Review.find({ event: eventId })
        .select("user event rating comment createdAt updatedAt")
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      auth
        ? Review.findOne({ event: eventId, user: auth.userId })
            .select("user event rating comment createdAt updatedAt")
            .populate("user", "name avatar")
            .lean()
        : Promise.resolve(null),
      Review.aggregate<{
        averageRating: number;
        totalReviews: number;
        distribution: Array<{ rating: number; count: number }>;
      }>([
        { $match: { event: new Types.ObjectId(eventId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratings: { $push: "$rating" },
          },
        },
        {
          $project: {
            _id: 0,
            averageRating: { $round: ["$averageRating", 1] },
            totalReviews: 1,
            distribution: {
              $map: {
                input: [1, 2, 3, 4, 5],
                as: "rating",
                in: {
                  rating: "$$rating",
                  count: {
                    $size: {
                      $filter: {
                        input: "$ratings",
                        as: "value",
                        cond: { $eq: ["$$value", "$$rating"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]),
      auth?.role === "attendee"
        ? Registration.exists({
            user: auth.userId,
            event: eventId,
            status: "confirmed",
          })
        : Promise.resolve(null),
    ],
  );

  const result = summary[0] ?? {
    averageRating: 0,
    totalReviews: 0,
    distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 })),
  };
  const eligibility = !auth
    ? { canReview: false, reason: "not_authenticated" as const }
    : auth.role !== "attendee"
      ? { canReview: false, reason: "not_attendee" as const }
      : myReview
        ? { canReview: false, reason: "already_reviewed" as const }
        : !confirmedRegistration
          ? { canReview: false, reason: "not_registered" as const }
          : event.endDate > new Date()
            ? { canReview: false, reason: "event_not_ended" as const }
            : { canReview: true, reason: "eligible" as const };

  return {
    reviews,
    myReview,
    eligibility,
    summary: result,
    pagination: {
      page,
      limit,
      total: result.totalReviews,
      pages: Math.ceil(result.totalReviews / limit),
    },
  };
};

export const updateReview = async (
  userId: string,
  reviewId: string,
  rating: number,
  comment: string,
) => {
  assertObjectId(reviewId, "Review");
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, user: userId },
    { $set: { rating, comment } },
    { returnDocument: "after", runValidators: true },
  ).populate("user", "name avatar");
  if (!review) throw new HttpError(404, "Review not found");
  return review;
};

export const deleteReview = async (userId: string, reviewId: string) => {
  assertObjectId(reviewId, "Review");
  const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
  if (!review) throw new HttpError(404, "Review not found");
};
