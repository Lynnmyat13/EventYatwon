import type { Notification } from "@/types/notifications";

export const notificationHref = (notification: Notification): string => {
  if (notification.type === "ticket") return "/my-tickets";
  if (
    notification.type === "registration" ||
    notification.title === "Event cancelled"
  ) {
    return "/my-events";
  }
  return notification.event?.slug
    ? `/events/${notification.event.slug}`
    : "/notifications";
};
