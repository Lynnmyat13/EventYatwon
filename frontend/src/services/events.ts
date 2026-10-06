import axios from "axios";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type {
  CreateEventInput,
  Event,
  EventListData,
  EventQuery,
  EventStatus,
  PublicEventStats,
  PublicOrganizer,
} from "@/types/events";

interface ApiError {
  message?: string;
}

export const getEvents = async (
  query: EventQuery,
  signal?: AbortSignal,
): Promise<EventListData> => {
  const response = await api.get<ApiResponse<EventListData>>("/events", {
    params: { ...query, limit: 9 },
    signal,
  });

  return response.data.data;
};

export const getPublicEventStats = async (): Promise<PublicEventStats> => {
  const response =
    await api.get<ApiResponse<{ stats: PublicEventStats }>>("/events/stats");
  return response.data.data.stats;
};

export const getCalendarEvents = async (
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<Event[]> => {
  const response = await api.get<ApiResponse<EventListData>>("/events", {
    params: { page: 1, limit: 100, sort: "date", from, to },
    signal,
  });
  return response.data.data.events;
};

export const getRecommendedEvents = async (): Promise<Event[]> => {
  const response = await api.get<ApiResponse<{ events: Event[] }>>(
    "/events/recommended",
  );
  return response.data.data.events;
};

export const getPublicOrganizer = async (
  id: string,
  signal?: AbortSignal,
): Promise<PublicOrganizer> => {
  const response = await api.get<ApiResponse<PublicOrganizer>>(
    `/organizers/${encodeURIComponent(id)}`,
    { signal },
  );
  return response.data.data;
};

export const getEventBySlug = async (
  slug: string,
  signal?: AbortSignal,
): Promise<Event> => {
  const response = await api.get<ApiResponse<{ event: Event }>>(
    `/events/${encodeURIComponent(slug)}`,
    { signal },
  );

  return response.data.data.event;
};

export const createEvent = async (
  input: CreateEventInput,
  bannerImage?: File,
): Promise<Event> => {
  const data = bannerImage ? new FormData() : input;
  if (data instanceof FormData) {
    data.append("payload", JSON.stringify(input));
    data.append("bannerImage", bannerImage as File);
  }
  const response = await api.post<ApiResponse<{ event: Event }>>(
    "/events",
    data,
    bannerImage
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined,
  );
  return response.data.data.event;
};

export interface OrganizerEventQuery {
  page: number;
  search?: string;
  status?: EventStatus;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  ticketTypes?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

export const getOrganizerEvents = async (
  query: OrganizerEventQuery,
): Promise<EventListData> => {
  const response = await api.get<ApiResponse<EventListData>>(
    "/events/my-events",
    { params: { ...query, limit: 8, sort: "newest" } },
  );
  return response.data.data;
};

export const deleteOrganizerEvent = async (eventId: string): Promise<void> => {
  await api.delete(`/events/${encodeURIComponent(eventId)}`);
};

export const updateEventDetails = async (
  eventId: string,
  input: UpdateEventInput,
): Promise<Event> => {
  const response = await api.put<ApiResponse<{ event: Event }>>(
    `/events/${encodeURIComponent(eventId)}`,
    input,
  );
  return response.data.data.event;
};

export const replaceEventBanner = async (
  eventId: string,
  image: File,
): Promise<Event> => {
  const data = new FormData();
  data.append("bannerImage", image);
  const response = await api.post<ApiResponse<{ event: Event }>>(
    `/events/${encodeURIComponent(eventId)}/banner`,
    data,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data.data.event;
};

export const removeEventBanner = async (eventId: string): Promise<Event> => {
  const response = await api.delete<ApiResponse<{ event: Event }>>(
    `/events/${encodeURIComponent(eventId)}/banner`,
  );
  return response.data.data.event;
};

export const updateEventVenue = async (
  eventId: string,
  venue: Pick<Event["venue"], "name" | "address">,
): Promise<Event> => {
  const response = await api.put<ApiResponse<{ event: Event }>>(
    `/events/${encodeURIComponent(eventId)}`,
    { venue },
  );
  return response.data.data.event;
};

export const updateEventStatus = async (
  eventId: string,
  status: Event["status"],
): Promise<Event> => {
  const response = await api.put<ApiResponse<{ event: Event }>>(
    `/events/${encodeURIComponent(eventId)}`,
    { status },
  );
  return response.data.data.event;
};

export const isEventNotFound = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404;

export const getEventErrorMessage = (
  error: unknown,
  fallback = "Events could not be loaded.",
): string => {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response)
      return "Could not reach the event service. Check your connection and try again.";
    return error.response.data?.message || fallback;
  }

  return fallback;
};
