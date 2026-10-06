import type { EventStatus } from "@/types/events";
import type { UserRole } from "@/types/auth";

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: { registrations: number; tickets: number; organizedEvents: number };
}

export interface AdminEvent {
  _id: string;
  organizer: { _id: string; name: string; email: string };
  title: string;
  slug: string;
  category: string;
  banner: string | null;
  startDate: string;
  endDate: string;
  venue: { name: string; address: string };
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  createdAt: string;
}

export interface AdminActivity {
  id: string;
  type: "user" | "event" | "registration" | "ticket";
  message: string;
  event?: { id: string; title: string; slug: string };
  createdAt: string;
}

export interface AdminDashboard {
  summary: {
    totalUsers: number;
    totalOrganizers: number;
    totalAttendees: number;
    totalEvents: number;
    totalRegistrations: number;
    totalTickets: number;
  };
  activity: AdminActivity[];
}

export interface AdminCategory {
  name: string;
  totalEvents: number;
  publishedEvents: number;
}
