import type { Event } from "@/types/events";

export type RegistrationStatus =
  "pending" | "confirmed" | "cancelled" | "refunded";

export type RegistrationEvent = Pick<
  Event,
  | "_id"
  | "title"
  | "slug"
  | "banner"
  | "startDate"
  | "endDate"
  | "venue"
  | "status"
  | "category"
  | "capacity"
  | "registeredCount"
  | "ticketTypes"
>;

export interface Registration {
  _id: string;
  user: string;
  event: RegistrationEvent | string;
  ticketType: string;
  quantity: number;
  status: RegistrationStatus;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationApiError {
  message: string;
  status?: number;
}
