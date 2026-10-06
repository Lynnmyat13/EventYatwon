import type { Event, EventStatus } from "@/types/events";
import type { RegistrationStatus } from "@/types/registrations";
import type { TicketStatus } from "@/types/tickets";

export interface ManagementPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ManagementUser {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ManagementOverview {
  event: Event;
  metrics: {
    capacity: number;
    totalRegistrations: number;
    registeredCount: number;
    ticketsIssued: number;
    checkedInAttendees: number;
    remainingCapacity: number;
    revenue: number;
  };
  ticketBreakdown: Array<{
    name: string;
    price: number;
    quantity: number;
    sold: number;
    revenue: number;
  }>;
}

export interface ManagementAnalytics {
  summary: {
    totalRegistrations: number;
    capacityUsedPercent: number;
    ticketsIssued: number;
    totalCheckIns: number;
    checkInRatePercent: number;
    revenue: number;
  };
  registrationsOverTime: Array<{
    date: string;
    registrations: number;
  }>;
  ticketTypes: Array<{ name: string; value: number }>;
  checkIns: Array<{ name: string; value: number }>;
  statistics: {
    cancelledRegistrations: number;
    averageTicketsPerRegistration: number;
  };
}

export interface ManagementAttendee {
  registrationId: string;
  attendee: ManagementUser;
  ticketType: string;
  quantity: number;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInCount: number;
}

export interface ManagementTicket {
  _id: string;
  user: ManagementUser;
  ticketCode: string;
  ticketType: string;
  status: TicketStatus;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
}

export interface ManagementCheckIn extends Pick<
  ManagementTicket,
  "_id" | "user" | "ticketCode" | "ticketType" | "status" | "checkedInAt"
> {}

export interface ManagementListQuery {
  page: number;
  search?: string;
  status?: RegistrationStatus | TicketStatus;
  ticketType?: string;
  checkedIn?: boolean;
}

export interface ManagementEventSettings {
  status: EventStatus;
}
