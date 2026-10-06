import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  ImageOff,
  LoaderCircle,
  MapPin,
  ScanLine,
  Ticket,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RegistrationDialog } from "@/components/RegistrationDialog";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatTicketPrice } from "@/lib/currency";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  getEventBySlug,
  getEventErrorMessage,
  isEventNotFound,
} from "@/services/events";
import { getMyRegistrations } from "@/services/registrations";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat();

const DetailsSkeleton = () => (
  <section className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 motion-reduce:animate-none sm:px-6 lg:px-8">
    <div className="bg-muted aspect-16/7 rounded-lg" />
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <div className="bg-muted h-5 w-28 rounded" />
        <div className="bg-muted h-12 w-4/5 rounded" />
        <div className="bg-muted h-6 w-3/5 rounded" />
        <div className="space-y-3 pt-8">
          <div className="bg-muted h-4 w-full rounded" />
          <div className="bg-muted h-4 w-full rounded" />
          <div className="bg-muted h-4 w-2/3 rounded" />
        </div>
      </div>
      <div className="bg-muted h-80 rounded-lg" />
    </div>
  </section>
);

const NotFoundState = () => (
  <section className="mx-auto grid min-h-[62dvh] max-w-7xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
    <div className="max-w-md">
      <CalendarDays
        aria-hidden="true"
        className="text-primary mx-auto size-10"
        strokeWidth={1.5}
      />
      <h1 className="text-foreground mt-5 text-3xl font-semibold tracking-normal">
        Event not found
      </h1>
      <p className="text-muted-foreground mt-3 leading-7">
        This event may be unavailable, unpublished, or removed.
      </p>
      <Link to="/events" className={cn(buttonVariants(), "mt-6 h-10 px-4")}>
        <ArrowLeft aria-hidden="true" className="size-4" /> Explore events
      </Link>
    </div>
  </section>
);

export function EventDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const [openedAt] = useState(Date.now);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const eventQuery = useQuery({
    queryKey: queryKeys.events.detail(slug ?? ""),
    queryFn: ({ signal }) => getEventBySlug(slug ?? "", signal),
    enabled: Boolean(slug),
    staleTime: 2 * 60_000,
  });
  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: getMyRegistrations,
    enabled: user?.role === "attendee" && Boolean(eventQuery.data),
    staleTime: 45_000,
  });

  if (!slug) return <NotFoundState />;
  if (eventQuery.isPending) return <DetailsSkeleton />;
  if (eventQuery.error && isEventNotFound(eventQuery.error))
    return <NotFoundState />;

  if (!eventQuery.data) {
    return (
      <section className="mx-auto grid min-h-[62dvh] max-w-7xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-md">
          <AlertCircle
            aria-hidden="true"
            className="text-destructive mx-auto size-10"
            strokeWidth={1.5}
          />
          <h1 className="text-foreground mt-5 text-3xl font-semibold tracking-normal">
            Could not load event
          </h1>
          <p className="text-muted-foreground mt-3 leading-7">
            {getEventErrorMessage(eventQuery.error)}
          </p>
          <Button
            className="mt-6 h-10 px-4"
            onClick={() => void eventQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </section>
    );
  }

  const event = eventQuery.data;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  const isCancelled = event.status === "cancelled";
  const ticketsSoldOut =
    event.ticketTypes.length > 0 &&
    event.ticketTypes.every(
      (ticketType) => ticketType.sold >= ticketType.quantity,
    );
  const isSoldOut = event.registeredCount >= event.capacity || ticketsSoldOut;
  const isRegistrationClosed = endDate.getTime() <= openedAt;
  const isCheckingRegistration =
    user?.role === "attendee" && registrationsQuery.isPending;
  const existingRegistration = registrationsQuery.data?.find((registration) => {
    if (
      registration.status === "cancelled" ||
      registration.status === "refunded"
    ) {
      return false;
    }
    const registrationEvent = registration.event;
    return (
      (typeof registrationEvent === "string"
        ? registrationEvent
        : registrationEvent._id) === event._id
    );
  });
  const organizerName =
    typeof event.organizer === "string"
      ? "Event organizer"
      : event.organizer.name;
  const organizerEmail =
    typeof event.organizer === "string" ? undefined : event.organizer.email;
  const organizerId =
    typeof event.organizer === "string" ? event.organizer : event.organizer._id;
  const canManageCheckIn =
    user?.role === "admin" ||
    (user?.role === "organizer" && user.id === organizerId);
  const hasBanner = Boolean(event.banner) && failedBanner !== event.banner;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue.name} ${event.venue.address}`,
  )}`;

  const openRegistration = () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${event.slug}` } });
      return;
    }
    if (existingRegistration) {
      navigate(`/registrations/${existingRegistration._id}`);
      return;
    }
    if (user.role === "attendee") setIsRegistrationOpen(true);
  };

  const registrationLabel = existingRegistration
    ? "View registration"
    : isCancelled
      ? "Event cancelled"
      : isSoldOut
        ? "Sold out"
        : isRegistrationClosed
          ? "Registration closed"
          : !user
            ? "Sign in to register"
            : isCheckingRegistration
              ? "Checking registration"
              : "Register";

  const registrationDisabled =
    !existingRegistration &&
    (isCancelled ||
      isSoldOut ||
      isRegistrationClosed ||
      isCheckingRegistration);
  const canShowRegistration = !user || user.role === "attendee";

  return (
    <article className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to="/events"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to events
      </Link>

      <div className="bg-muted relative mt-6 aspect-4/3 overflow-hidden rounded-lg sm:aspect-16/8 lg:aspect-21/8">
        {hasBanner ? (
          <img
            src={event.banner ?? undefined}
            alt={`${event.title} banner`}
            className="size-full object-cover"
            onError={() => setFailedBanner(event.banner)}
          />
        ) : (
          <div className="text-muted-foreground grid size-full place-items-center">
            <ImageOff
              aria-hidden="true"
              className="size-12"
              strokeWidth={1.3}
            />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-accent text-accent-foreground rounded-md px-2 py-1 text-xs font-semibold">
              {event.category}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-1 text-xs font-semibold capitalize",
                isCancelled
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {event.status}
            </span>
          </div>

          <h1 className="text-foreground mt-4 text-4xl leading-tight font-semibold tracking-normal sm:text-5xl">
            {event.title}
          </h1>

          {isCancelled && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mt-6 rounded-lg border px-4 py-3 text-sm font-medium">
              This event has been cancelled.
            </div>
          )}

          <dl className="mt-8 grid gap-5 border-y py-6 sm:grid-cols-2">
            <div className="flex gap-3">
              <CalendarDays
                aria-hidden="true"
                className="text-primary mt-0.5 size-5 shrink-0"
                strokeWidth={1.7}
              />
              <div>
                <dt className="text-muted-foreground text-sm">Date and time</dt>
                <dd className="text-foreground mt-1 font-medium">
                  {dateFormatter.format(startDate)}
                </dd>
                <dd className="text-muted-foreground mt-1 text-sm">
                  {timeFormatter.format(startDate)} to{" "}
                  {sameDay
                    ? timeFormatter.format(endDate)
                    : `${dateFormatter.format(endDate)}, ${timeFormatter.format(endDate)}`}
                </dd>
              </div>
            </div>

            <div className="flex gap-3">
              <UserRound
                aria-hidden="true"
                className="text-primary mt-0.5 size-5 shrink-0"
                strokeWidth={1.7}
              />
              <div>
                <dt className="text-muted-foreground text-sm">Organizer</dt>
                <dd className="mt-1 font-medium">
                  <Link
                    to={`/organizers/${organizerId}`}
                    className="text-foreground hover:text-primary"
                  >
                    {organizerName}
                  </Link>
                </dd>
                {(user?.role === "attendee" || user?.role === "organizer") &&
                  organizerEmail && (
                    <dd className="mt-1 text-sm">
                      <a
                        href={`mailto:${organizerEmail}`}
                        className="text-primary hover:underline"
                      >
                        {organizerEmail}
                      </a>
                    </dd>
                  )}
              </div>
            </div>

            <div className="flex gap-3">
              <UsersRound
                aria-hidden="true"
                className="text-primary mt-0.5 size-5 shrink-0"
                strokeWidth={1.7}
              />
              <div>
                <dt className="text-muted-foreground text-sm">Attendance</dt>
                <dd className="text-foreground mt-1 font-medium">
                  {numberFormatter.format(event.registeredCount)} registered
                </dd>
                <dd className="text-muted-foreground mt-1 text-sm">
                  Capacity {numberFormatter.format(event.capacity)}
                </dd>
              </div>
            </div>
          </dl>

          <section
            className="mt-9 border-y py-6"
            aria-labelledby="event-location"
          >
            <div className="flex items-start gap-3">
              <MapPin
                aria-hidden="true"
                className="text-primary mt-1 size-5 shrink-0"
                strokeWidth={1.7}
              />
              <div>
                <h2 id="event-location" className="text-lg font-semibold">
                  Location
                </h2>
                <p className="mt-2 font-medium">{event.venue.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {event.venue.address}
                </p>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                >
                  View on Map{" "}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
          </section>

          <section className="mt-9" aria-labelledby="event-description">
            <h2
              id="event-description"
              className="text-foreground text-2xl font-semibold tracking-normal"
            >
              About this event
            </h2>
            <p className="text-muted-foreground mt-4 leading-7 whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        </div>

        <aside className="border-border bg-card rounded-lg border p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-foreground text-lg font-semibold">Tickets</h2>
            {isSoldOut && !isCancelled && (
              <span className="bg-destructive/15 text-destructive rounded-md px-2 py-1 text-xs font-semibold">
                Sold out
              </span>
            )}
          </div>

          {event.ticketTypes.length ? (
            <ul className="mt-4 divide-y">
              {event.ticketTypes.map((ticketType, index) => (
                <li
                  key={`${ticketType.name}-${index}`}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate font-medium">
                      {ticketType.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {Math.max(0, ticketType.quantity - ticketType.sold)}{" "}
                      available
                    </p>
                  </div>
                  <span className="text-foreground shrink-0 font-semibold">
                    {formatTicketPrice(ticketType.price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              Ticket information is not available yet.
            </p>
          )}

          <div className="mt-5 grid gap-3 border-t pt-5">
            {canManageCheckIn && (
              <Link
                to={`/organizer/events/${event._id}/manage`}
                className={cn(buttonVariants(), "h-11 px-4")}
              >
                Manage event
              </Link>
            )}
            {canManageCheckIn && (
              <Link
                to={`/organizer/events/${event._id}/check-in`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 px-4",
                )}
              >
                <ScanLine aria-hidden="true" className="size-4" /> Check in
                tickets
              </Link>
            )}
            {canShowRegistration && (
              <Button
                className="h-11"
                disabled={registrationDisabled}
                onClick={openRegistration}
              >
                {isCheckingRegistration ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Ticket aria-hidden="true" className="size-4" />
                )}
                {registrationLabel}
              </Button>
            )}
            <FavoriteButton
              eventId={event._id}
              eventSlug={event.slug}
              showLabel
            />
          </div>
        </aside>
      </div>

      <ReviewsSection event={event} />

      {isRegistrationOpen && (
        <RegistrationDialog
          event={event}
          onClose={() => setIsRegistrationOpen(false)}
          onRegistered={async (registration) => {
            toast.success("Registration confirmed");
            setIsRegistrationOpen(false);
            navigate(`/registrations/${registration._id}`);
          }}
        />
      )}
    </article>
  );
}
