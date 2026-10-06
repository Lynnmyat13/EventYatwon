import { useRef } from "react";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationQueries,
} from "@/hooks/useNotifications";
import { notificationHref } from "@/lib/notifications";
import type { Notification } from "@/types/notifications";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function NotificationBell() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const navigate = useNavigate();
  const { notifications: notificationsQuery, unreadCount: unreadCountQuery } =
    useNotificationQueries();
  const markOneMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const notifications = notificationsQuery.data;
  const unreadCount = unreadCountQuery.data ?? 0;
  const error = notificationsQuery.isError || unreadCountQuery.isError;

  const openNotification = (notification: Notification) => {
    if (!notification.isRead) {
      markOneMutation.mutate(notification._id, {
        onError: () => toast.error("Could not mark notification as read"),
      });
    }
    detailsRef.current?.removeAttribute("open");
    navigate(notificationHref(notification));
  };

  const markAll = () =>
    markAllMutation.mutate(undefined, {
      onError: () => toast.error("Could not mark notifications as read"),
    });

  return (
    <details
      ref={detailsRef}
      className="group relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.removeAttribute("open");
        }
      }}
    >
      <summary
        className="focus-visible:ring-primary relative grid size-10 cursor-pointer list-none place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </summary>

      <div className="absolute top-full right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-zinc-800 bg-black/95 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <p className="font-semibold text-white">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-300 hover:bg-zinc-900 hover:text-white"
              disabled={markAllMutation.isPending}
              onClick={markAll}
            >
              {markAllMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notificationsQuery.isPending ? (
            <div className="grid min-h-32 place-items-center">
              <LoaderCircle className="size-5 animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-400">
              Could not load notifications.
              <button
                className="ml-1 text-white underline"
                onClick={() => {
                  void notificationsQuery.refetch();
                  void unreadCountQuery.refetch();
                }}
              >
                Retry
              </button>
            </div>
          ) : notifications?.length ? (
            notifications.slice(0, 6).map((notification) => (
              <button
                key={notification._id}
                type="button"
                className="relative block w-full border-b border-zinc-900 px-4 py-3 text-left hover:bg-zinc-900/80"
                onClick={() => openNotification(notification)}
              >
                {!notification.isRead && (
                  <span className="bg-primary absolute top-4 left-2 size-1.5 rounded-full" />
                )}
                <p className="truncate text-sm font-medium text-white">
                  {notification.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                  {notification.message}
                </p>
                <time className="mt-1 block text-[11px] text-zinc-500">
                  {dateFormatter.format(new Date(notification.createdAt))}
                </time>
              </button>
            ))
          ) : (
            <p className="px-4 py-10 text-center text-sm text-zinc-400">
              No notifications yet.
            </p>
          )}
        </div>

        <Link
          to="/notifications"
          className="block border-t border-zinc-800 px-4 py-3 text-center text-sm font-medium text-white hover:bg-zinc-900"
          onClick={() => detailsRef.current?.removeAttribute("open")}
        >
          View all notifications
        </Link>
      </div>
    </details>
  );
}
