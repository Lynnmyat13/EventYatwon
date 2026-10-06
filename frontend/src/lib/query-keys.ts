import type { EventQuery } from "@/types/events";
import type { ManagementListQuery } from "@/types/eventManagement";

export const queryKeys = {
  events: {
    all: ["events"] as const,
    stats: ["events", "stats"] as const,
    list: (filters: EventQuery) => ["events", filters] as const,
    detail: (slug: string) => ["event", slug] as const,
    calendar: (from: string, to: string) =>
      ["events", "calendar", { from, to }] as const,
  },
  organizers: {
    all: ["organizers"] as const,
    detail: (id: string) => ["organizers", id] as const,
  },
  recommendations: {
    all: ["recommendations"] as const,
  },
  registrations: {
    all: ["my-registrations"] as const,
    detail: (id: string) => ["my-registrations", id] as const,
  },
  tickets: {
    all: ["my-tickets"] as const,
    detail: (id: string) => ["my-tickets", id] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    status: (eventId: string) => ["favorites", "status", eventId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: ["notifications", "list"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  organizerEvents: {
    all: ["organizer-events"] as const,
  },
  management: {
    all: ["organizer-event"] as const,
    overview: (eventId: string) => ["organizer-event", eventId] as const,
    attendeesAll: (eventId: string) => ["event-attendees", eventId] as const,
    attendees: (eventId: string, filters: ManagementListQuery) =>
      ["event-attendees", eventId, filters] as const,
    ticketsAll: (eventId: string) => ["event-tickets", eventId] as const,
    tickets: (eventId: string, filters: ManagementListQuery) =>
      ["event-tickets", eventId, filters] as const,
    checkInsAll: (eventId: string) => ["event-check-ins", eventId] as const,
    checkIns: (eventId: string, filters: ManagementListQuery) =>
      ["event-check-ins", eventId, filters] as const,
    analytics: (eventId: string) => ["organizer-analytics", eventId] as const,
  },
  reviews: {
    all: (eventId: string) => ["event-reviews", eventId] as const,
    list: (eventId: string, page: number, viewer: string) =>
      ["event-reviews", eventId, { page, viewer }] as const,
  },
  admin: {
    all: ["admin"] as const,
    dashboard: ["admin", "dashboard"] as const,
    usersAll: ["admin", "users"] as const,
    users: (filters: object) => ["admin", "users", filters] as const,
    user: (id: string) => ["admin", "users", "detail", id] as const,
    eventsAll: ["admin", "events"] as const,
    events: (filters: object) => ["admin", "events", filters] as const,
    categories: ["admin", "categories"] as const,
  },
} as const;

const privateQueryRoots = new Set([
  "my-registrations",
  "my-tickets",
  "favorites",
  "notifications",
  "organizer-events",
  "organizer-event",
  "event-attendees",
  "event-tickets",
  "event-check-ins",
  "organizer-analytics",
  "admin",
  "recommendations",
]);

export const isPrivateQueryKey = (queryKey: readonly unknown[]): boolean =>
  typeof queryKey[0] === "string" && privateQueryRoots.has(queryKey[0]);
