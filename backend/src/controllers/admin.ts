import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import type { EventStatus, UserRole } from "../models";
import {
  cancelAdminEvent,
  getAdminDashboard,
  getAdminUser,
  listAdminCategories,
  listAdminEvents,
  listAdminUsers,
  setAdminUserStatus,
} from "../services/admin";
import { HttpError, sendSuccess } from "../utils/http";

const roles: UserRole[] = ["attendee", "organizer", "admin"];
const statuses: EventStatus[] = [
  "draft",
  "pending",
  "published",
  "completed",
  "cancelled",
];
const value = (input: unknown): string | undefined =>
  typeof input === "string" && input.trim() ? input.trim() : undefined;

const id = (req: Request): string => {
  const result = req.params.id;
  if (typeof result !== "string" || !result)
    throw new HttpError(404, "Resource not found");
  return result;
};

const listOptions = (req: Request) => {
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
  return { page, limit, search: value(req.query.search) };
};

export const dashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(
      res,
      200,
      "Admin dashboard retrieved",
      await getAdminDashboard(),
    );
  } catch (error) {
    next(error);
  }
};

export const users = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = value(req.query.role);
    if (role && !roles.includes(role as UserRole))
      throw new HttpError(400, "Invalid user role");
    const active = value(req.query.isActive);
    if (active && active !== "true" && active !== "false")
      throw new HttpError(400, "isActive must be true or false");
    sendSuccess(
      res,
      200,
      "Users retrieved",
      await listAdminUsers({
        ...listOptions(req),
        role: role as UserRole | undefined,
        isActive: active === undefined ? undefined : active === "true",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const user = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(res, 200, "User retrieved", {
      user: await getAdminUser(id(req)),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (typeof req.body?.isActive !== "boolean")
      throw new HttpError(400, "isActive must be a boolean");
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) throw new HttpError(401, "Authentication required");
    sendSuccess(res, 200, "User status updated", {
      user: await setAdminUserStatus(id(req), auth.userId, req.body.isActive),
    });
  } catch (error) {
    next(error);
  }
};

export const events = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = value(req.query.status);
    if (status && !statuses.includes(status as EventStatus))
      throw new HttpError(400, "Invalid event status");
    sendSuccess(
      res,
      200,
      "Events retrieved",
      await listAdminEvents({
        ...listOptions(req),
        status: status as EventStatus | undefined,
        category: value(req.query.category),
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const cancelEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) throw new HttpError(401, "Authentication required");
    sendSuccess(res, 200, "Event cancelled", {
      event: await cancelAdminEvent(id(req), auth.userId),
    });
  } catch (error) {
    next(error);
  }
};

export const categories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(res, 200, "Categories retrieved", {
      categories: await listAdminCategories(),
    });
  } catch (error) {
    next(error);
  }
};
