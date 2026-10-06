import type { NextFunction, Request, Response } from "express";
import { getPublicOrganizer } from "../services/organizers";
import { HttpError, sendSuccess } from "../utils/http";

export const organizer = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (typeof id !== "string" || !id)
      throw new HttpError(404, "Organizer not found");
    sendSuccess(res, 200, "Organizer retrieved", await getPublicOrganizer(id));
  } catch (error) {
    next(error);
  }
};
