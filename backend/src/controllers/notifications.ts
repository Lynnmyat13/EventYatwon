import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  deleteAllNotifications as deleteAllNotificationRecords,
  deleteNotification as deleteNotificationRecord,
  getNotifications as getNotificationRecords,
  getUnreadCount as getUnreadNotificationCount,
  markAllNotificationsRead as markAllNotificationRecordsRead,
  markNotificationRead as markNotificationRecordRead,
} from "../services/notifications";
import { HttpError, sendSuccess } from "../utils/http";

const userId = (req: Request): string => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new HttpError(401, "Authentication required");
  return auth.userId;
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteNotificationRecord(userId(req), notificationId(req));
    sendSuccess(res, 200, "Notification deleted");
  } catch (error) {
    next(error);
  }
};

export const deleteAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteAllNotificationRecords(userId(req));
    sendSuccess(res, 200, "Notifications deleted");
  } catch (error) {
    next(error);
  }
};

const notificationId = (req: Request): string => {
  const id = req.params.id;
  if (typeof id !== "string" || !id) {
    throw new HttpError(404, "Notification not found");
  }
  return id;
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const notifications = await getNotificationRecords(userId(req));
    sendSuccess(res, 200, "Notifications retrieved", { notifications });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const count = await getUnreadNotificationCount(userId(req));
    sendSuccess(res, 200, "Unread notification count retrieved", { count });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const notification = await markNotificationRecordRead(
      userId(req),
      notificationId(req),
    );
    sendSuccess(res, 200, "Notification marked as read", { notification });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await markAllNotificationRecordsRead(userId(req));
    sendSuccess(res, 200, "All notifications marked as read");
  } catch (error) {
    next(error);
  }
};
