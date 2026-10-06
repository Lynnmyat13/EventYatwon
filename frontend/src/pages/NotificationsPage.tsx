import { Bell, CheckCheck, LoaderCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationQueries,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { notificationHref } from "@/lib/notifications";
import type { Notification } from "@/types/notifications";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NotificationsPage() {
  const { notifications: notificationsQuery } = useNotificationQueries();
  const markOneMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const deleteOneMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();
  const notifications = notificationsQuery.data;

  const markOne = (notification: Notification) => {
    if (notification.isRead) return;
    markOneMutation.mutate(notification._id, {
      onError: () => toast.error("Could not mark notification as read"),
    });
  };

  const markAll = () =>
    markAllMutation.mutate(undefined, {
      onError: () => toast.error("Could not mark notifications as read"),
    });

  const removeOne = (notification: Notification) =>
    deleteOneMutation.mutate(notification._id, {
      onSuccess: () => toast.success("Notification deleted"),
      onError: () => toast.error("Could not delete notification"),
    });

  const removeAll = () => {
    if (!window.confirm("Delete all notifications?")) return;
    deleteAllMutation.mutate(undefined, {
      onSuccess: () => toast.success("Notifications deleted"),
      onError: () => toast.error("Could not delete notifications"),
    });
  };

  const unreadCount =
    notifications?.filter((notification) => !notification.isRead).length ?? 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Updates</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">
            Notifications
          </h1>
        </div>
        {notifications?.length ? (
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                className="h-10"
                disabled={markAllMutation.isPending}
                onClick={markAll}
              >
                {markAllMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              className="text-destructive h-10"
              disabled={deleteAllMutation.isPending}
              onClick={removeAll}
            >
              {deleteAllMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete all
            </Button>
          </div>
        ) : null}
      </div>

      {notificationsQuery.isPending ? (
        <div className="mt-8 space-y-3" aria-label="Loading notifications">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="bg-muted h-28 animate-pulse rounded" />
          ))}
        </div>
      ) : notificationsQuery.isError ? (
        <div className="mt-8 grid min-h-72 place-items-center border-y text-center">
          <div>
            <Bell className="text-destructive mx-auto size-9" />
            <h2 className="mt-4 text-xl font-semibold">
              Could not load notifications
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Notifications could not be loaded.
            </p>
            <Button
              className="mt-5"
              onClick={() => void notificationsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : notifications?.length ? (
        <div className="mt-8 divide-y border-y">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={cn(
                "hover:bg-muted/50 relative transition-colors",
                !notification.isRead && "bg-primary/5 pl-8",
              )}
            >
              {!notification.isRead && (
                <span className="bg-primary absolute top-7 left-4 size-2 rounded-full" />
              )}
              <Link
                to={notificationHref(notification)}
                className="grid gap-2 px-5 py-5 pr-14 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
                onClick={() => markOne(notification)}
              >
                <div className="min-w-0">
                  <h2 className="font-semibold">{notification.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    {notification.message}
                  </p>
                </div>
                <time
                  dateTime={notification.createdAt}
                  className="text-muted-foreground text-xs sm:pt-1"
                >
                  {dateFormatter.format(new Date(notification.createdAt))}
                </time>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive absolute top-3 right-3"
                disabled={
                  deleteOneMutation.isPending &&
                  deleteOneMutation.variables === notification._id
                }
                aria-label={`Delete ${notification.title} notification`}
                title="Delete notification"
                onClick={() => removeOne(notification)}
              >
                {deleteOneMutation.isPending &&
                deleteOneMutation.variables === notification._id ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid min-h-72 place-items-center border-y text-center">
          <div className="max-w-sm">
            <Bell className="text-primary mx-auto size-10" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold">No notifications</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Registration, event, and ticket updates will appear here.
            </p>
            <Link to="/events" className={cn(buttonVariants(), "mt-5")}>
              Explore events
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
