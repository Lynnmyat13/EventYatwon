import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type { Notification } from "@/types/notifications";

export const getNotifications = async (): Promise<Notification[]> => {
  const response =
    await api.get<ApiResponse<{ notifications: Notification[] }>>(
      "/notifications",
    );
  return response.data.data.notifications;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get<ApiResponse<{ count: number }>>(
    "/notifications/unread-count",
  );
  return response.data.data.count;
};

export const markNotificationRead = async (
  id: string,
): Promise<Notification> => {
  const response = await api.patch<ApiResponse<{ notification: Notification }>>(
    `/notifications/${encodeURIComponent(id)}/read`,
  );
  return response.data.data.notification;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${encodeURIComponent(id)}`);
};

export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete("/notifications");
};
