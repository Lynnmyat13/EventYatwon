import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type {
  ManagementAttendee,
  ManagementAnalytics,
  ManagementCheckIn,
  ManagementListQuery,
  ManagementOverview,
  ManagementPagination,
  ManagementTicket,
} from "@/types/eventManagement";

const path = (eventId: string, resource: string) =>
  `/events/${encodeURIComponent(eventId)}/manage/${resource}`;

export const getManagementOverview = async (
  eventId: string,
): Promise<ManagementOverview> => {
  const response = await api.get<ApiResponse<{ overview: ManagementOverview }>>(
    path(eventId, "overview"),
  );
  return response.data.data.overview;
};

export const getManagementAnalytics = async (
  eventId: string,
): Promise<ManagementAnalytics> => {
  const response = await api.get<
    ApiResponse<{ analytics: ManagementAnalytics }>
  >(path(eventId, "analytics"));
  return response.data.data.analytics;
};

export const getManagementAttendees = async (
  eventId: string,
  query: ManagementListQuery,
) => {
  const response = await api.get<
    ApiResponse<{
      attendees: ManagementAttendee[];
      pagination: ManagementPagination;
    }>
  >(path(eventId, "attendees"), { params: { ...query, limit: 15 } });
  return response.data.data;
};

export const getManagementTickets = async (
  eventId: string,
  query: ManagementListQuery,
) => {
  const response = await api.get<
    ApiResponse<{
      tickets: ManagementTicket[];
      pagination: ManagementPagination;
    }>
  >(path(eventId, "tickets"), { params: { ...query, limit: 20 } });
  return response.data.data;
};

export const getManagementCheckIns = async (
  eventId: string,
  query: ManagementListQuery,
) => {
  const response = await api.get<
    ApiResponse<{
      checkIns: ManagementCheckIn[];
      pagination: ManagementPagination;
    }>
  >(path(eventId, "check-ins"), { params: { ...query, limit: 20 } });
  return response.data.data;
};
