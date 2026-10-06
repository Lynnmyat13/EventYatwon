import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  getManagementAttendees as getAttendeeRecords,
  getManagementAnalytics as getAnalyticsRecord,
  getManagementCheckIns as getCheckInRecords,
  getManagementOverview as getOverviewRecord,
  getManagementTickets as getTicketRecords,
  type ManagementListOptions,
} from "../services/eventManagement";
import { HttpError, sendSuccess } from "../utils/http";

const context = (req: Request) => {
  const auth = (req as AuthenticatedRequest).auth;
  const eventId = req.params.eventId;
  if (!auth) throw new HttpError(401, "Authentication required");
  if (typeof eventId !== "string" || !eventId) {
    throw new HttpError(404, "Event not found");
  }
  return { auth, eventId };
};

const queryString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const listOptions = (req: Request): ManagementListOptions => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new HttpError(
      400,
      "page and limit must be positive whole numbers, with limit at most 100",
    );
  }
  const checkedIn = queryString(req.query.checkedIn);
  if (checkedIn && checkedIn !== "true" && checkedIn !== "false") {
    throw new HttpError(400, "checkedIn must be true or false");
  }
  return {
    page,
    limit,
    search: queryString(req.query.search),
    status: queryString(req.query.status),
    ticketType: queryString(req.query.ticketType),
    checkedIn: checkedIn === undefined ? undefined : checkedIn === "true",
  };
};

export const getManagementOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { auth, eventId } = context(req);
    sendSuccess(res, 200, "Event management overview retrieved", {
      overview: await getOverviewRecord(eventId, auth.userId, auth.role),
    });
  } catch (error) {
    next(error);
  }
};

export const getManagementAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { auth, eventId } = context(req);
    sendSuccess(res, 200, "Event analytics retrieved", {
      analytics: await getAnalyticsRecord(eventId, auth.userId, auth.role),
    });
  } catch (error) {
    next(error);
  }
};

export const getManagementAttendees = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { auth, eventId } = context(req);
    sendSuccess(
      res,
      200,
      "Event attendees retrieved",
      await getAttendeeRecords(
        eventId,
        auth.userId,
        auth.role,
        listOptions(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const getManagementTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { auth, eventId } = context(req);
    sendSuccess(
      res,
      200,
      "Event tickets retrieved",
      await getTicketRecords(eventId, auth.userId, auth.role, listOptions(req)),
    );
  } catch (error) {
    next(error);
  }
};

export const getManagementCheckIns = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { auth, eventId } = context(req);
    sendSuccess(
      res,
      200,
      "Event check-ins retrieved",
      await getCheckInRecords(
        eventId,
        auth.userId,
        auth.role,
        listOptions(req),
      ),
    );
  } catch (error) {
    next(error);
  }
};
