import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  archiveCancelledTicket as archiveCancelledTicketRecord,
  checkInTicket as checkInTicketRecord,
  getMyTickets as getTicketRecords,
  getTicketById as getTicketRecord,
} from "../services/tickets";
import { HttpError, sendSuccess } from "../utils/http";

const authUser = (req: Request) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new HttpError(401, "Authentication required");
  return auth;
};

const ticketId = (req: Request): string => {
  const id = req.params.id;
  if (typeof id !== "string" || !id)
    throw new HttpError(404, "Ticket not found");
  return id;
};

export const getMyTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tickets = await getTicketRecords(authUser(req).userId);
    sendSuccess(res, 200, "Tickets retrieved", { tickets });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authUser(req);
    const ticket = await getTicketRecord(auth.userId, auth.role, ticketId(req));
    sendSuccess(res, 200, "Ticket retrieved", { ticket });
  } catch (error) {
    next(error);
  }
};

export const archiveCancelledTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await archiveCancelledTicketRecord(authUser(req).userId, ticketId(req));
    sendSuccess(res, 200, "Cancelled ticket removed");
  } catch (error) {
    next(error);
  }
};

export const checkInTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = authUser(req);
    const eventId = req.params.eventId;
    if (typeof eventId !== "string" || !eventId) {
      throw new HttpError(404, "Event not found", "EVENT_NOT_FOUND");
    }

    const body = req.body as Record<string, unknown> | undefined;
    const qrToken =
      typeof body?.qrToken === "string" ? body.qrToken.trim() : "";
    const ticketCode =
      typeof body?.ticketCode === "string" ? body.ticketCode.trim() : "";
    if ((!qrToken && !ticketCode) || (qrToken && ticketCode)) {
      throw new HttpError(
        400,
        "Provide either a QR token or ticket code/ID",
        "INVALID_CHECK_IN_INPUT",
      );
    }

    const ticket = await checkInTicketRecord(eventId, auth.userId, auth.role, {
      ...(qrToken ? { qrToken } : { ticketCode }),
    });
    sendSuccess(res, 200, "Ticket checked in successfully", { ticket });
  } catch (error) {
    next(error);
  }
};
