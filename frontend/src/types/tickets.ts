import type { RegistrationEvent } from "@/types/registrations";

export type TicketStatus = "active" | "used" | "cancelled" | "expired";

export interface Ticket {
  _id: string;
  registration: string;
  event: RegistrationEvent | string;
  user: string;
  ticketCode: string;
  qrToken?: string;
  ticketType: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketApiError {
  message: string;
  status?: number;
  code?: CheckInErrorCode;
}

export type CheckInErrorCode =
  | "EVENT_NOT_FOUND"
  | "CHECK_IN_FORBIDDEN"
  | "INVALID_CHECK_IN_INPUT"
  | "TICKET_NOT_FOUND"
  | "WRONG_EVENT"
  | "TICKET_CANCELLED"
  | "ALREADY_CHECKED_IN"
  | "TICKET_INACTIVE";

export interface CheckInSummary {
  event: { title: string; slug: string };
  attendee: { name: string; avatar: string | null };
  ticketCode: string;
  ticketType: string;
  status: "used";
  checkedIn: true;
  checkedInAt: string;
}
