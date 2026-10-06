export type EventSort = "date" | "newest";
export type EventStatus =
  "draft" | "pending" | "published" | "completed" | "cancelled";

export interface EventOrganizer {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface EventTicketType {
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface EventVenue {
  name: string;
  address: string;
}

export interface Event {
  _id: string;
  organizer: string | EventOrganizer;
  title: string;
  slug: string;
  description: string;
  category: string;
  banner: string | null;
  startDate: string;
  endDate: string;
  venue: Pick<EventVenue, "name" | "address">;
  capacity: number;
  registeredCount: number;
  ticketTypes: EventTicketType[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventQuery {
  page: number;
  search?: string;
  category?: string;
  date?: string;
  from?: string;
  to?: string;
  minPrice?: string;
  maxPrice?: string;
  sort: EventSort;
}

export interface PublicOrganizer {
  organizer: {
    _id: string;
    name: string;
    avatar: string | null;
    createdAt: string;
  };
  events: Event[];
  stats: {
    publishedEvents: number;
    registrations: number;
  };
}

export interface EventListData {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PublicEventStats {
  publishedEvents: number;
  registrations: number;
  categories: string[];
  averageRating: number;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  banner: string | null;
  startDate: string;
  endDate: string;
  venue: EventVenue;
  capacity: number;
  ticketTypes: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  status: Extract<EventStatus, "draft" | "published">;
}
