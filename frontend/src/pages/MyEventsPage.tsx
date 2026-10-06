import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { RegistrationCard } from "@/components/RegistrationCard";
import { Button } from "@/components/ui/button";
import {
  invalidateRegistrationData,
  updateEventAvailabilityCache,
} from "@/lib/query-invalidation";
import { queryKeys } from "@/lib/query-keys";
import {
  cancelRegistration,
  dismissCancelledRegistration,
  getMyRegistrations,
  getRegistrationApiError,
} from "@/services/registrations";
import type { Registration, RegistrationEvent } from "@/types/registrations";

const RegistrationSkeleton = () => (
  <div className="overflow-hidden rounded-lg border sm:grid sm:grid-cols-[13rem_minmax(0,1fr)]">
    <div className="bg-muted aspect-video animate-pulse sm:aspect-auto sm:min-h-56" />
    <div className="space-y-4 p-5">
      <div className="bg-muted h-7 w-3/5 animate-pulse rounded" />
      <div className="bg-muted h-4 w-2/5 animate-pulse rounded" />
      <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
      <div className="bg-muted h-9 w-full animate-pulse rounded" />
    </div>
  </div>
);

function EmptySection({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed px-5 py-10 text-center text-sm">
      <CalendarDays className="mx-auto mb-3 size-7" strokeWidth={1.5} />
      {message}
    </div>
  );
}

export function MyEventsPage() {
  const [openedAt] = useState(Date.now);
  const queryClient = useQueryClient();
  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: getMyRegistrations,
    staleTime: 45_000,
  });
  const cancelMutation = useMutation({
    mutationFn: (registration: Registration) =>
      cancelRegistration(registration._id),
    onSuccess: async (cancelled) => {
      queryClient.setQueryData<Registration[]>(
        queryKeys.registrations.all,
        (current) =>
          current?.map((item) =>
            item._id === cancelled._id ? cancelled : item,
          ) ?? [cancelled],
      );
      const event = cancelled.event as RegistrationEvent;
      updateEventAvailabilityCache(queryClient, event);
      await invalidateRegistrationData(queryClient, event.slug);
      toast.success("Registration cancelled");
    },
    onError: (error) => toast.error(getRegistrationApiError(error).message),
  });
  const dismissMutation = useMutation({
    mutationFn: (registration: Registration) =>
      dismissCancelledRegistration(registration._id),
    onSuccess: (_result, registration) => {
      queryClient.setQueryData<Registration[]>(
        queryKeys.registrations.all,
        (current) =>
          current?.filter((item) => item._id !== registration._id) ?? [],
      );
      toast.success("Cancelled registration removed");
    },
    onError: (error) => toast.error(getRegistrationApiError(error).message),
  });

  const handleCancel = async (registration: Registration) => {
    if (!window.confirm("Cancel this registration?")) return;
    cancelMutation.mutate(registration);
  };

  const handleDismiss = (registration: Registration) => {
    if (!window.confirm("Remove this cancelled registration from My Events?"))
      return;
    dismissMutation.mutate(registration);
  };

  if (registrationsQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-muted mb-8 h-10 w-48 animate-pulse rounded" />
        <div className="space-y-5">
          <RegistrationSkeleton />
          <RegistrationSkeleton />
        </div>
      </main>
    );
  }

  if (registrationsQuery.isError) {
    return (
      <main className="mx-auto grid min-h-[62dvh] max-w-5xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-md">
          <AlertCircle className="text-destructive mx-auto size-10" />
          <h1 className="mt-5 text-3xl font-semibold">
            Could not load your events
          </h1>
          <p className="text-muted-foreground mt-3">
            {getRegistrationApiError(registrationsQuery.error).message}
          </p>
          <Button
            className="mt-6 h-10 px-4"
            onClick={() => void registrationsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const registrations = registrationsQuery.data ?? [];
  const cancelled = registrations.filter((registration) => {
    const event = registration.event as RegistrationEvent;
    return (
      registration.status === "cancelled" ||
      registration.status === "refunded" ||
      event.status === "cancelled"
    );
  });
  const active = registrations.filter(
    (registration) => !cancelled.includes(registration),
  );
  const upcoming = active.filter(
    (registration) =>
      new Date((registration.event as RegistrationEvent).endDate).getTime() >=
      openedAt,
  );
  const past = active.filter(
    (registration) => !upcoming.includes(registration),
  );

  const sections = [
    { title: "Upcoming events", items: upcoming, empty: "No upcoming events." },
    { title: "Past events", items: past, empty: "No past events." },
    {
      title: "Cancelled registrations",
      items: cancelled,
      empty: "No cancelled registrations.",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-primary text-sm font-semibold">Attendee dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
          My events
        </h1>
      </div>

      <div className="space-y-12">
        {sections.map((section) => (
          <section
            key={section.title}
            aria-labelledby={section.title.replaceAll(" ", "-")}
          >
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-3">
              <h2
                id={section.title.replaceAll(" ", "-")}
                className="text-xl font-semibold"
              >
                {section.title}
              </h2>
              <span className="text-muted-foreground text-sm">
                {section.items.length}
              </span>
            </div>
            {section.items.length ? (
              <div className="space-y-5">
                {section.items.map((registration) => {
                  const event = registration.event as RegistrationEvent;
                  const canCancel =
                    section.title === "Upcoming events" &&
                    event.status !== "cancelled" &&
                    event.status !== "completed" &&
                    new Date(event.startDate).getTime() > openedAt &&
                    (registration.status === "confirmed" ||
                      registration.status === "pending");
                  return (
                    <RegistrationCard
                      key={registration._id}
                      registration={registration}
                      canCancel={canCancel}
                      canDismiss={section.title === "Cancelled registrations"}
                      isCancelling={
                        cancelMutation.isPending &&
                        cancelMutation.variables._id === registration._id
                      }
                      isDismissing={
                        dismissMutation.isPending &&
                        dismissMutation.variables._id === registration._id
                      }
                      onCancel={() => handleCancel(registration)}
                      onDismiss={() => handleDismiss(registration)}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptySection message={section.empty} />
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
