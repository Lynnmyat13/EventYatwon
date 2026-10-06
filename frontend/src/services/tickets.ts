import axios from "axios";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/auth";
import type { CheckInSummary, Ticket, TicketApiError } from "@/types/tickets";

interface ApiErrorBody {
  message?: string;
  code?: TicketApiError["code"];
}

export const getMyTickets = async (): Promise<Ticket[]> => {
  const response =
    await api.get<ApiResponse<{ tickets: Ticket[] }>>("/tickets/me");
  return response.data.data.tickets;
};

export const getTicket = async (id: string): Promise<Ticket> => {
  const response = await api.get<ApiResponse<{ ticket: Ticket }>>(
    `/tickets/${encodeURIComponent(id)}`,
  );
  return response.data.data.ticket;
};

export const dismissCancelledTicket = async (id: string): Promise<void> => {
  await api.delete(`/tickets/${encodeURIComponent(id)}/history`);
};

export const checkInTicket = async (
  eventId: string,
  credential: { qrToken: string } | { ticketCode: string },
): Promise<CheckInSummary> => {
  const response = await api.post<ApiResponse<{ ticket: CheckInSummary }>>(
    `/events/${encodeURIComponent(eventId)}/check-in`,
    credential,
  );
  return response.data.data.ticket;
};

export const getTicketApiError = (error: unknown): TicketApiError => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return {
      status: error.response?.status,
      code: error.response?.data?.code,
      message:
        error.response?.data?.message ||
        (error.response
          ? "Ticket could not be loaded."
          : "Could not reach the ticket service."),
    };
  }
  return { message: "Ticket could not be loaded." };
};
