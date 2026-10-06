import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  archiveCancelledRegistration as archiveCancelledRegistrationRecord,
  cancelRegistration as cancelRegistrationRecord,
  createRegistration,
  getMyRegistrations as getMyRegistrationRecords,
  getRegistrationById as getRegistrationRecordById,
} from "../services/registrations";
import { HttpError, sendSuccess } from "../utils/http";

const authUserId = (req: Request): string => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new HttpError(401, "Authentication required");
  return auth.userId;
};

export const archiveCancelledRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await archiveCancelledRegistrationRecord(
      authUserId(req),
      routeParam(req.params.id, "Registration"),
    );
    sendSuccess(res, 200, "Cancelled registration removed");
  } catch (error) {
    next(error);
  }
};

const routeParam = (value: string | string[] | undefined, resource: string): string => {
  if (typeof value !== "string" || !value) throw new HttpError(404, `${resource} not found`);
  return value;
};

export const registerForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown> | undefined;
    const ticketType = body?.ticketType;
    const quantity = body?.quantity;

    if (typeof ticketType !== "string" || !ticketType.trim()) {
      throw new HttpError(400, "Ticket type is required");
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, "Quantity must be a positive whole number");
    }

    const registration = await createRegistration(
      authUserId(req),
      routeParam(req.params.eventId, "Event"),
      ticketType.trim(),
      quantity,
    );
    sendSuccess(res, 201, "Event registration successful", { registration });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const registrations = await getMyRegistrationRecords(authUserId(req));
    sendSuccess(res, 200, "Registrations retrieved", { registrations });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const registration = await getRegistrationRecordById(
      authUserId(req),
      routeParam(req.params.id, "Registration"),
    );
    sendSuccess(res, 200, "Registration retrieved", { registration });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const registration = await cancelRegistrationRecord(
      authUserId(req),
      routeParam(req.params.id, "Registration"),
    );
    sendSuccess(res, 200, "Registration cancelled", { registration });
  } catch (error) {
    next(error);
  }
};
