import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Event } from "@/types/events";
import type { RegistrationEvent } from "@/types/registrations";

export const updateEventAvailabilityCache = (
  client: QueryClient,
  event: RegistrationEvent,
): void => {
  client.setQueryData<Event>(queryKeys.events.detail(event.slug), (current) =>
    current
      ? {
          ...current,
          capacity: event.capacity,
          registeredCount: event.registeredCount,
          ticketTypes: event.ticketTypes,
        }
      : current,
  );
};

export const invalidateRegistrationData = async (
  client: QueryClient,
  eventSlug?: string,
): Promise<void> => {
  await Promise.all([
    eventSlug
      ? client.invalidateQueries({
          queryKey: queryKeys.events.detail(eventSlug),
        })
      : Promise.resolve(),
    client.invalidateQueries({ queryKey: queryKeys.events.all }),
    client.invalidateQueries({ queryKey: queryKeys.registrations.all }),
    client.invalidateQueries({ queryKey: queryKeys.tickets.all }),
    client.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    client.invalidateQueries({ queryKey: queryKeys.recommendations.all }),
    client.invalidateQueries({ queryKey: queryKeys.organizers.all }),
  ]);
};

export const invalidateEventManagementData = async (
  client: QueryClient,
  eventId: string,
): Promise<void> => {
  await Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.management.overview(eventId),
    }),
    client.invalidateQueries({
      queryKey: queryKeys.management.attendeesAll(eventId),
    }),
    client.invalidateQueries({
      queryKey: queryKeys.management.ticketsAll(eventId),
    }),
    client.invalidateQueries({
      queryKey: queryKeys.management.checkInsAll(eventId),
    }),
    client.invalidateQueries({
      queryKey: queryKeys.management.analytics(eventId),
    }),
  ]);
};
