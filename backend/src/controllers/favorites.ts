import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  addFavorite as addFavoriteRecord,
  getFavoriteStatus as getFavoriteStatusRecord,
  getMyFavorites as getFavoriteRecords,
  removeFavorite as removeFavoriteRecord,
} from "../services/favorites";
import { HttpError, sendSuccess } from "../utils/http";

const context = (req: Request) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new HttpError(401, "Authentication required");
  return auth;
};

const eventId = (req: Request): string => {
  const value = req.params.eventId;
  if (typeof value !== "string" || !value) {
    throw new HttpError(404, "Event not found");
  }
  return value;
};

export const getFavoriteStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isFavorite = await getFavoriteStatusRecord(
      context(req).userId,
      eventId(req),
    );
    sendSuccess(res, 200, "Favorite status retrieved", { isFavorite });
  } catch (error) {
    next(error);
  }
};

export const getMyFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const favorites = await getFavoriteRecords(context(req).userId);
    sendSuccess(res, 200, "Favorites retrieved", { favorites });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const favorite = await addFavoriteRecord(context(req).userId, eventId(req));
    sendSuccess(res, 201, "Event saved", { favorite });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await removeFavoriteRecord(context(req).userId, eventId(req));
    sendSuccess(res, 200, "Event removed from favorites");
  } catch (error) {
    next(error);
  }
};
