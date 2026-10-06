import axios from "axios";
import { api } from "@/services/api";
import type { ApiResponse, UserRole } from "@/types/auth";
import type { EventStatus } from "@/types/events";
import type {
  AdminCategory,
  AdminDashboard,
  AdminEvent,
  AdminPagination,
  AdminUser,
} from "@/types/admin";

export const getAdminDashboard = async (): Promise<AdminDashboard> =>
  (await api.get<ApiResponse<AdminDashboard>>("/admin/dashboard")).data.data;

export const getAdminUsers = async (query: {
  page: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}): Promise<{ users: AdminUser[]; pagination: AdminPagination }> =>
  (
    await api.get<
      ApiResponse<{ users: AdminUser[]; pagination: AdminPagination }>
    >("/admin/users", { params: query })
  ).data.data;

export const getAdminUser = async (id: string): Promise<AdminUser> =>
  (
    await api.get<ApiResponse<{ user: AdminUser }>>(
      `/admin/users/${encodeURIComponent(id)}`,
    )
  ).data.data.user;

export const setAdminUserStatus = async (
  id: string,
  isActive: boolean,
): Promise<AdminUser> =>
  (
    await api.patch<ApiResponse<{ user: AdminUser }>>(
      `/admin/users/${encodeURIComponent(id)}/status`,
      { isActive },
    )
  ).data.data.user;

export const getAdminEvents = async (query: {
  page: number;
  search?: string;
  status?: EventStatus;
  category?: string;
}): Promise<{ events: AdminEvent[]; pagination: AdminPagination }> =>
  (
    await api.get<
      ApiResponse<{ events: AdminEvent[]; pagination: AdminPagination }>
    >("/admin/events", { params: query })
  ).data.data;

export const cancelAdminEvent = async (id: string): Promise<AdminEvent> =>
  (
    await api.patch<ApiResponse<{ event: AdminEvent }>>(
      `/admin/events/${encodeURIComponent(id)}/cancel`,
    )
  ).data.data.event;

export const getAdminCategories = async (): Promise<AdminCategory[]> =>
  (
    await api.get<ApiResponse<{ categories: AdminCategory[] }>>(
      "/admin/categories",
    )
  ).data.data.categories;

export const getAdminError = (error: unknown, fallback: string): string =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : fallback;
