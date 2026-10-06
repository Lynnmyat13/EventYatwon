export type NotificationType =
  "registration" | "ticket" | "event_update" | "reminder" | "system";

export interface NotificationEvent {
  _id: string;
  title: string;
  slug: string;
  status: string;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  event?: NotificationEvent | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
