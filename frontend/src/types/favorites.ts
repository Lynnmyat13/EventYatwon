import type { Event } from "@/types/events";

export interface Favorite {
  _id: string;
  user: string;
  event: Event | string;
  createdAt: string;
  updatedAt: string;
}
