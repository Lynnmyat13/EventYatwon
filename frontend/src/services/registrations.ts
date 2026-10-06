import axios from "axios";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type { Registration, RegistrationApiError } from "@/types/registrations";

interface ApiErrorBody {
  message?: string;
}

export const registerForEvent = async (
  eventId: string,
  ticketType: string,
  quantity: number,
): Promise<Registration> => {
  const response = await api.post<ApiResponse<{ registration: Registration }>>(
    `/events/${eventId}/register`,
    { ticketType, quantity },
  );
  return response.data.data.registration;
};

export const getMyRegistrations = async (): Promise<Registration[]> => {
  const response =
    await api.get<ApiResponse<{ registrations: Registration[] }>>(
      "/registrations/me",
    );
  return response.data.data.registrations;
};

export const getRegistration = async (id: string): Promise<Registration> => {
  const response = await api.get<ApiResponse<{ registration: Registration }>>(
    `/registrations/${encodeURIComponent(id)}`,
  );
  return response.data.data.registration;
};

export const cancelRegistration = async (id: string): Promise<Registration> => {
  const response = await api.delete<
    ApiResponse<{ registration: Registration }>
  >(`/registrations/${encodeURIComponent(id)}`);
  return response.data.data.registration;
};

export const dismissCancelledRegistration = async (
  id: string,
): Promise<void> => {
  await api.delete(`/registrations/${encodeURIComponent(id)}/history`);
};

export const getRegistrationApiError = (
  error: unknown,
): RegistrationApiError => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return {
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        (error.response
          ? "Registration could not be completed."
          : "Could not reach the registration service."),
    };
  }
  return { message: "Registration could not be completed." };
};
