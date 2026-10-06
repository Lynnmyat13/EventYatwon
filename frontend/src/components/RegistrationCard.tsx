import { useState } from "react";
import {
  CalendarDays,
  Eye,
  ImageOff,
  LoaderCircle,
  MapPin,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Registration, RegistrationEvent } from "@/types/registrations";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function RegistrationCard({
  registration,
  canCancel,
  isCancelling,
  canDismiss,
  isDismissing,
  onCancel,
  onDismiss,
}: {
  registration: Registration;
  canCancel: boolean;
  isCancelling: boolean;
  canDismiss: boolean;
  isDismissing: boolean;
  onCancel(): void;
  onDismiss(): void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const event = registration.event as RegistrationEvent;
  const hasBanner = Boolean(event.banner) && !imageFailed;

  return (
    <article className="bg-card text-card-foreground overflow-hidden rounded-lg border sm:grid sm:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="bg-muted aspect-video sm:aspect-auto sm:min-h-56">
        {hasBanner ? (
          <img
            src={event.banner ?? undefined}
            alt={`${event.title} banner`}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="text-muted-foreground grid size-full place-items-center">
            <ImageOff aria-hidden="true" className="size-8" strokeWidth={1.4} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-foreground text-xl font-semibold tracking-normal">
            {event.title}
          </h3>
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-semibold capitalize",
              registration.status === "cancelled" ||
                registration.status === "refunded"
                ? "bg-destructive/10 text-destructive"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {registration.status}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <CalendarDays className="text-primary mt-0.5 size-4 shrink-0" />
            <div>
              <dt className="sr-only">Date and time</dt>
              <dd>{dateFormatter.format(new Date(event.startDate))}</dd>
            </div>
          </div>
          <div className="flex min-w-0 gap-2">
            <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <dt className="sr-only">Venue</dt>
              <dd className="truncate">{event.venue.name}</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <Ticket className="text-primary mt-0.5 size-4 shrink-0" />
            <div>
              <dt className="sr-only">Ticket</dt>
              <dd>
                {registration.ticketType} x {registration.quantity}
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
          <Link
            to={`/events/${event.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3")}
          >
            View event
          </Link>
          <Link
            to={`/registrations/${registration._id}`}
            className={cn(buttonVariants(), "h-9 px-3")}
          >
            <Eye aria-hidden="true" className="size-4" /> View registration
          </Link>
          {canCancel && (
            <Button
              variant="destructive"
              className="h-9 px-3 sm:ml-auto"
              disabled={isCancelling}
              onClick={onCancel}
            >
              {isCancelling ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <XCircle className="size-4" />
              )}
              {isCancelling ? "Cancelling" : "Cancel registration"}
            </Button>
          )}
          {canDismiss && (
            <Button
              variant="outline"
              className="text-destructive h-9 px-3 sm:ml-auto"
              disabled={isDismissing}
              onClick={onDismiss}
            >
              {isDismissing ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {isDismissing ? "Removing" : "Remove from history"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
