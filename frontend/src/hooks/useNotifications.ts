import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import type { Notification } from "@/types/notifications";

export const useNotificationQueries = () => {
  const notifications = useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: getNotifications,
    staleTime: 20_000,
  });
  const unreadCount = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: getUnreadNotificationCount,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
  return { notifications, unreadCount };
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list,
      );
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount,
      );
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.list,
        (items) =>
          items?.map((item) =>
            item._id === id ? { ...item, isRead: true } : item,
          ),
      );
      queryClient.setQueryData<number>(
        queryKeys.notifications.unreadCount,
        (count = 0) => Math.max(0, count - 1),
      );
      return { previousNotifications, previousCount };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(
        queryKeys.notifications.list,
        context?.previousNotifications,
      );
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount,
        context?.previousCount,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list,
      );
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount,
      );
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.list,
        (items) => items?.map((item) => ({ ...item, isRead: true })),
      );
      queryClient.setQueryData(queryKeys.notifications.unreadCount, 0);
      return { previousNotifications, previousCount };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        queryKeys.notifications.list,
        context?.previousNotifications,
      );
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount,
        context?.previousCount,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list,
      );
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount,
      );
      const deleted = previousNotifications?.find((item) => item._id === id);
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.list,
        (items) => items?.filter((item) => item._id !== id),
      );
      if (deleted && !deleted.isRead) {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unreadCount,
          (count = 0) => Math.max(0, count - 1),
        );
      }
      return { previousNotifications, previousCount };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(
        queryKeys.notifications.list,
        context?.previousNotifications,
      );
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount,
        context?.previousCount,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.list,
      );
      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount,
      );
      queryClient.setQueryData(queryKeys.notifications.list, []);
      queryClient.setQueryData(queryKeys.notifications.unreadCount, 0);
      return { previousNotifications, previousCount };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        queryKeys.notifications.list,
        context?.previousNotifications,
      );
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount,
        context?.previousCount,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
};
