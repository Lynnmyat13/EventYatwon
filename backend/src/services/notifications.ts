import { Types } from "mongoose";
import { Notification } from "../models";
import { HttpError } from "../utils/http";

const eventFields = "title slug status";

const assertNotificationId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, "Notification not found");
  }
};

export const getNotifications = (userId: string) =>
  Notification.find({ user: userId })
    .select("type title message event isRead createdAt updatedAt")
    .populate("event", eventFields)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

export const getUnreadCount = (userId: string) =>
  Notification.countDocuments({ user: userId, isRead: false });

export const markNotificationRead = async (userId: string, id: string) => {
  assertNotificationId(id);
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: { isRead: true } },
    { returnDocument: "after" },
  )
    .select("type title message event isRead createdAt updatedAt")
    .populate("event", eventFields);
  if (!notification) throw new HttpError(404, "Notification not found");
  return notification;
};

export const markAllNotificationsRead = (userId: string) =>
  Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } },
  );

export const deleteNotification = async (userId: string, id: string) => {
  assertNotificationId(id);
  const notification = await Notification.findOneAndDelete({
    _id: id,
    user: userId,
  });
  if (!notification) throw new HttpError(404, "Notification not found");
};

export const deleteAllNotifications = (userId: string) =>
  Notification.deleteMany({ user: userId });
