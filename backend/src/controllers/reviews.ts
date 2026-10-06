import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  createReview as createReviewRecord,
  deleteReview as deleteReviewRecord,
  getEventReviews as getEventReviewRecords,
  updateReview as updateReviewRecord,
} from "../services/reviews";
import { HttpError, sendSuccess } from "../utils/http";

const authUserId = (req: Request): string => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new HttpError(401, "Authentication required");
  return auth.userId;
};

const routeParam = (value: string | string[] | undefined, resource: string) => {
  if (typeof value !== "string" || !value) {
    throw new HttpError(404, `${resource} not found`);
  }
  return value;
};

const reviewInput = (req: Request) => {
  const body = req.body as Record<string, unknown> | undefined;
  const rating = body?.rating;
  const comment = body?.comment;
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new HttpError(400, "Rating must be a whole number from 1 to 5");
  }
  if (typeof comment !== "string" || !comment.trim()) {
    throw new HttpError(400, "Comment is required");
  }
  if (comment.trim().length > 2000) {
    throw new HttpError(400, "Comment cannot exceed 2000 characters");
  }
  return { rating, comment: comment.trim() };
};

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = reviewInput(req);
    const review = await createReviewRecord(
      authUserId(req),
      routeParam(req.params.eventId, "Event"),
      input.rating,
      input.comment,
    );
    sendSuccess(res, 201, "Review created", { review });
  } catch (error) {
    next(error);
  }
};

export const getEventReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      throw new HttpError(
        400,
        "page and limit must be positive whole numbers, with limit at most 50",
      );
    }
    sendSuccess(
      res,
      200,
      "Reviews retrieved",
      await getEventReviewRecords(
        routeParam(req.params.eventId, "Event"),
        auth,
        page,
        limit,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = reviewInput(req);
    const review = await updateReviewRecord(
      authUserId(req),
      routeParam(req.params.id, "Review"),
      input.rating,
      input.comment,
    );
    sendSuccess(res, 200, "Review updated", { review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteReviewRecord(
      authUserId(req),
      routeParam(req.params.id, "Review"),
    );
    sendSuccess(res, 200, "Review deleted");
  } catch (error) {
    next(error);
  }
};
