import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Compass,
  Heart,
  ImageOff,
  MapPin,
  Ticket,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getMyFavorites } from "@/services/favorites";
import { getMyRegistrations } from "@/services/registrations";
import { getMyTickets } from "@/services/tickets";
import type { Event } from "@/types/events";
import type { Favorite } from "@/types/favorites";
import type { Registration, RegistrationEvent } from "@/types/registrations";
import type { Ticket as TicketRecord } from "@/types/tickets";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function EventThumbnail({ event }: { event: RegistrationEvent | Event }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="bg-muted aspect-video w-full shrink-0 overflow-hidden rounded-md sm:aspect-auto sm:size-24">
      {event.banner && !failed ? (
        <img
          src={event.banner}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="text-muted-foreground grid size-full place-items-center">
          <ImageOff className="size-6" strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="text-muted-foreground grid min-h-40 place-items-center border-y text-center text-sm">
      <div>
        <Icon className="mx-auto size-7" strokeWidth={1.5} />
        <p className="mt-3">{message}</p>
      </div>
    </div>
  );
}

export function AttendeeDashboardPage() {
  const { user } = useAuth();
  const [openedAt] = useState(Date.now);
  const activityStorageKey = `eventyatwon:dismissed-activity:${user?.id ?? "guest"}`;
  const [dismissedActivityIds, setDismissedActivityIds] = useState<Set<string>>(
    () => {
      try {
        return new Set<string>(
          JSON.parse(localStorage.getItem(activityStorageKey) ?? "[]") as string[],
        );
      } catch {
        return new Set();
      }
    },
  );
  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: getMyRegistrations,
    staleTime: 45_000,
  });
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.all,
    queryFn: getMyTickets,
    staleTime: 45_000,
  });
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: getMyFavorites,
    staleTime: 60_000,
  });
  const isLoading =
    registrationsQuery.isPending ||
    ticketsQuery.isPending ||
    favoritesQuery.isPending;
  const hasError =
    registrationsQuery.isError ||
    ticketsQuery.isError ||
    favoritesQuery.isError;

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-muted h-10 w-64 animate-pulse rounded" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="bg-muted h-28 animate-pulse rounded" />
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="bg-muted h-72 animate-pulse rounded" />
          ))}
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="mx-auto grid min-h-[62dvh] max-w-5xl place-items-center px-4 text-center">
        <div>
          <AlertCircle className="text-destructive mx-auto size-10" />
          <h1 className="mt-4 text-3xl font-semibold">Dashboard unavailable</h1>
          <p className="text-muted-foreground mt-2">
            Your dashboard could not be loaded.
          </p>
          <Button
            className="mt-6 h-10 px-4"
            onClick={() => {
              void registrationsQuery.refetch();
              void ticketsQuery.refetch();
              void favoritesQuery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const registrations = (registrationsQuery.data ?? []).filter(
    (
      registration,
    ): registration is Registration & { event: RegistrationEvent } =>
      typeof registration.event !== "string" && Boolean(registration.event),
  );
  const tickets = (ticketsQuery.data ?? []).filter(
    (ticket): ticket is TicketRecord & { event: RegistrationEvent } =>
      typeof ticket.event !== "string" && Boolean(ticket.event),
  );
  const upcoming = registrations.filter((registration) => {
    const event = registration.event;
    return (
      registration.status !== "cancelled" &&
      registration.status !== "refunded" &&
      event.status !== "cancelled" &&
      new Date(event.endDate).getTime() >= openedAt
    );
  });
  const activeTickets = tickets.filter((ticket) => ticket.status === "active");
  const attendedEventIds = new Set(
    tickets
      .filter((ticket) => ticket.checkedIn)
      .map((ticket) => {
        return ticket.event._id;
      }),
  );
  const savedEvents = (favoritesQuery.data ?? []).filter(
    (favorite): favorite is Favorite & { event: Event } =>
      typeof favorite.event !== "string" && Boolean(favorite.event),
  );
  const allActivity = [
    ...registrations.map((registration) => ({
      id: `registration-${registration._id}`,
      date: registration.registeredAt,
      label: `Registered for ${registration.event.title}`,
    })),
    ...savedEvents.map((favorite) => ({
      id: `favorite-${favorite._id}`,
      date: favorite.createdAt,
      label: `Saved ${favorite.event.title}`,
    })),
    ...tickets
      .filter((ticket) => ticket.checkedInAt)
      .map((ticket) => ({
        id: `check-in-${ticket._id}`,
        date: ticket.checkedInAt as string,
        label: `Checked in to ${ticket.event.title}`,
      })),
  ].sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  const activity = allActivity
    .filter((item) => !dismissedActivityIds.has(item.id))
    .slice(0, 6);

  const dismissActivity = (id: string) => {
    setDismissedActivityIds((current) => {
      const next = new Set(current).add(id);
      localStorage.setItem(activityStorageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const clearActivity = () => {
    const next = new Set(allActivity.map((item) => item.id));
    setDismissedActivityIds((current) => {
      const merged = new Set([...current, ...next]);
      localStorage.setItem(activityStorageKey, JSON.stringify([...merged]));
      return merged;
    });
  };

  const summaries = [
    ["Upcoming events", upcoming.length, CalendarDays],
    ["Active tickets", activeTickets.length, Ticket],
    ["Saved events", savedEvents.length, Heart],
    ["Events attended", attendedEventIds.size, CheckCircle2],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">
            Attendee dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Welcome, {user?.name ?? "Attendee"}
          </h1>
        </div>
        <Link to="/events" className={cn(buttonVariants(), "h-11 px-4")}>
          <Compass className="size-4" /> Explore events
        </Link>
      </div>

      <section
        className="bg-border mt-8 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Dashboard summary"
      >
        {summaries.map(([label, value, Icon]) => (
          <div key={label} className="bg-card p-5">
            <Icon className="text-primary size-5" />
            <p className="text-muted-foreground mt-4 text-sm">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <div className="mt-10 grid items-start gap-x-10 gap-y-12 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Link to="/my-events" className="text-primary text-sm font-medium">
              View all
            </Link>
          </div>
          {upcoming.length ? (
            <div className="space-y-4">
              {upcoming.slice(0, 3).map((registration) => {
                const event = registration.event as RegistrationEvent;
                return (
                  <article
                    key={registration._id}
                    className="grid gap-4 border-b pb-4 sm:grid-cols-[6rem_minmax(0,1fr)]"
                  >
                    <EventThumbnail event={event} />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{event.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {dateFormatter.format(new Date(event.startDate))}
                      </p>
                      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                        <MapPin className="size-3.5" /> {event.venue.name}
                      </p>
                      <Link
                        to={`/events/${event.slug}`}
                        className="text-primary mt-3 inline-block text-sm font-medium"
                      >
                        View Event
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} message="No upcoming events." />
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold">My Tickets</h2>
            <Link to="/my-tickets" className="text-primary text-sm font-medium">
              View all
            </Link>
          </div>
          {tickets.length ? (
            <div className="divide-y">
              {tickets.slice(0, 4).map((ticket) => {
                const event = ticket.event;
                return (
                  <article
                    key={ticket._id}
                    className="flex items-center gap-4 py-4 first:pt-0"
                  >
                    <div className="bg-accent text-accent-foreground grid size-10 shrink-0 place-items-center rounded-md">
                      <Ticket className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{event.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {ticket.ticketType} -{" "}
                        <span className="capitalize">{ticket.status}</span>
                      </p>
                    </div>
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "shrink-0",
                      )}
                    >
                      View Ticket
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Ticket} message="No tickets yet." />
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold">Saved Events</h2>
            <Link
              to="/saved-events"
              className="text-primary text-sm font-medium"
            >
              View all
            </Link>
          </div>
          {savedEvents.length ? (
            <div className="space-y-4">
              {savedEvents.slice(0, 3).map((favorite) => {
                const event = favorite.event;
                return (
                  <article
                    key={favorite._id}
                    className="grid gap-4 border-b pb-4 sm:grid-cols-[6rem_minmax(0,1fr)]"
                  >
                    <EventThumbnail event={event} />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{event.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {dateFormatter.format(new Date(event.startDate))}
                      </p>
                      <Link
                        to={`/events/${event.slug}`}
                        className="text-primary mt-3 inline-block text-sm font-medium"
                      >
                        View Event
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Heart} message="No saved events." />
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {activity.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearActivity}>
                <Trash2 className="size-4" /> Clear all
              </Button>
            )}
          </div>
          {activity.length ? (
            <ol className="divide-y">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-4 first:pt-0">
                  <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <time
                      className="text-muted-foreground mt-1 block text-xs"
                      dateTime={item.date}
                    >
                      {dateFormatter.format(new Date(item.date))}
                    </time>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive -mt-2 shrink-0"
                    aria-label={`Remove activity: ${item.label}`}
                    title="Remove activity"
                    onClick={() => dismissActivity(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={CalendarDays} message="No recent activity." />
          )}
        </section>
      </div>
    </main>
  );
}
