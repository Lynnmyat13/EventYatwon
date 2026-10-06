import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Ticket,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  invalidateRegistrationData,
  updateEventAvailabilityCache,
} from "@/lib/query-invalidation";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  cancelRegistration,
  getRegistration,
  getRegistrationApiError,
} from "@/services/registrations";
import type { Registration, RegistrationEvent } from "@/types/registrations";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function RegistrationConfirmationPage() {
  const { id = "" } = useParams();
  const [openedAt] = useState(Date.now);
  const queryClient = useQueryClient();
  const registrationQuery = useQuery({
    queryKey: queryKeys.registrations.detail(id),
    queryFn: () => getRegistration(id),
    enabled: Boolean(id),
    staleTime: 45_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (registration: Registration) =>
      cancelRegistration(registration._id),
    onSuccess: async (cancelled) => {
      queryClient.setQueryData(queryKeys.registrations.detail(id), cancelled);
      const event = cancelled.event as RegistrationEvent;
      updateEventAvailabilityCache(queryClient, event);
      await invalidateRegistrationData(queryClient, event.slug);
      toast.success("Registration cancelled");
    },
    onError: (error) => toast.error(getRegistrationApiError(error).message),
  });

  if (registrationQuery.isPending) {
    return (
      <div
        className="grid min-h-[62dvh] place-items-center"
        role="status"
        aria-label="Loading registration"
      >
        <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  if (!registrationQuery.data) {
    return (
      <section className="mx-auto grid min-h-[62dvh] max-w-7xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-md">
          <h1 className="text-foreground text-3xl font-semibold">
            Registration unavailable
          </h1>
          <p className="text-muted-foreground mt-3">
            {getRegistrationApiError(registrationQuery.error).message}
          </p>
          <Link to="/events" className={cn(buttonVariants(), "mt-6 h-10 px-4")}>
            <ArrowLeft aria-hidden="true" className="size-4" /> Explore events
          </Link>
        </div>
      </section>
    );
  }

  const registration = registrationQuery.data;
  const event = registration.event as RegistrationEvent;
  const isCancelled =
    registration.status === "cancelled" || registration.status === "refunded";
  const canCancel =
    !isCancelled &&
    event.status !== "cancelled" &&
    event.status !== "completed" &&
    new Date(event.startDate).getTime() > openedAt;

  const handleCancel = async () => {
    if (!window.confirm("Cancel this registration?")) return;
    cancelMutation.mutate(registration);
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b pb-8 text-center">
        {isCancelled ? (
          <XCircle
            aria-hidden="true"
            className="text-destructive mx-auto size-12"
            strokeWidth={1.6}
          />
        ) : (
          <CheckCircle2
            aria-hidden="true"
            className="mx-auto size-12 text-emerald-500"
            strokeWidth={1.6}
          />
        )}
        <p className="text-primary mt-4 text-sm font-semibold">
          {isCancelled ? "Registration cancelled" : "Registration confirmed"}
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
          {event.title}
        </h1>
      </div>

      <dl className="grid gap-6 py-8 sm:grid-cols-2">
        <div className="flex gap-3">
          <Ticket className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <dt className="text-muted-foreground text-sm">Ticket</dt>
            <dd className="text-foreground mt-1 font-semibold">
              {registration.ticketType} x {registration.quantity}
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <CalendarDays className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <dt className="text-muted-foreground text-sm">Event date</dt>
            <dd className="text-foreground mt-1 font-semibold">
              {dateFormatter.format(new Date(event.startDate))}
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <MapPin className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <dt className="text-muted-foreground text-sm">Venue</dt>
            <dd className="text-foreground mt-1 font-semibold">
              {event.venue.name}
            </dd>
            <dd className="text-muted-foreground mt-1 text-sm">
              {event.venue.address}
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">Registration ID</dt>
          <dd className="text-foreground mt-1 font-mono text-sm break-all">
            {registration._id}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-center">
        {canCancel && (
          <Button
            variant="destructive"
            className="h-11 px-4"
            disabled={cancelMutation.isPending}
            onClick={handleCancel}
          >
            {cancelMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <XCircle className="size-4" />
            )}
            {cancelMutation.isPending ? "Cancelling" : "Cancel registration"}
          </Button>
        )}
        <Link to="/my-tickets" className={cn(buttonVariants(), "h-11 px-4")}>
          View tickets
        </Link>
        <Link
          to={`/events/${event.slug}`}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-4")}
        >
          View event
        </Link>
        <Link
          to="/events"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-4")}
        >
          Explore events
        </Link>
      </div>
    </section>
  );
}
