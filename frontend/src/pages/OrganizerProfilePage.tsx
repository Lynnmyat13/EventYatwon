import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  UsersRound,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { getEventErrorMessage, getPublicOrganizer } from "@/services/events";
import { getMyFavorites } from "@/services/favorites";

const number = new Intl.NumberFormat();
const month = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

export function OrganizerProfilePage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: queryKeys.organizers.detail(id),
    queryFn: ({ signal }) => getPublicOrganizer(id, signal),
    enabled: Boolean(id),
    staleTime: 3 * 60_000,
  });
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: getMyFavorites,
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  if (profileQuery.isPending) {
    return (
      <main
        className="mx-auto grid min-h-[60dvh] max-w-7xl place-items-center px-4"
        aria-label="Loading organizer profile"
      >
        <LoaderCircle className="text-primary size-7 animate-spin motion-reduce:animate-none" />
      </main>
    );
  }

  if (!profileQuery.data) {
    return (
      <main className="mx-auto grid min-h-[60dvh] max-w-7xl place-items-center px-4 text-center">
        <div className="max-w-md">
          <AlertCircle className="text-destructive mx-auto size-9" />
          <h1 className="mt-5 text-3xl font-semibold">Organizer unavailable</h1>
          <p className="text-muted-foreground mt-3 leading-7">
            {getEventErrorMessage(
              profileQuery.error,
              "This organizer profile could not be loaded.",
            )}
          </p>
          <Button className="mt-6" onClick={() => void profileQuery.refetch()}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const { organizer, events, stats } = profileQuery.data;
  const initials = organizer.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const favoriteIds = new Set(
    (favoritesQuery.data ?? []).map((favorite) =>
      typeof favorite.event === "string" ? favorite.event : favorite.event._id,
    ),
  );

  return (
    <main>
      <section className="bg-muted/35 border-b">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center lg:px-8 lg:py-16">
          <div className="bg-card grid size-28 overflow-hidden rounded-full border sm:size-36">
            {organizer.avatar ? (
              <img
                src={organizer.avatar}
                alt={`${organizer.name} profile`}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-primary m-auto text-3xl font-semibold">
                {initials}
              </span>
            )}
          </div>
          <div>
            <p className="text-primary text-sm font-semibold">
              Event organizer
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              {organizer.name}
            </h1>
            <p className="text-muted-foreground mt-3">
              Hosting on EventYatwon since{" "}
              {month.format(new Date(organizer.createdAt))}
            </p>
            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <dt className="text-muted-foreground text-sm">Events</dt>
                <dd className="mt-1 flex items-center gap-2 text-xl font-semibold">
                  <CalendarDays className="text-primary size-5" />
                  {number.format(stats.publishedEvents)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Registrations</dt>
                <dd className="mt-1 flex items-center gap-2 text-xl font-semibold">
                  <UsersRound className="text-primary size-5" />
                  {number.format(stats.registrations)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="text-3xl font-semibold tracking-tight">
          Events by {organizer.name}
        </h2>
        {events.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                isFavorite={user ? favoriteIds.has(event._id) : undefined}
                isFavoriteLoading={Boolean(user) && favoritesQuery.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed px-6 py-14 text-center">
            <CalendarDays className="text-muted-foreground mx-auto size-8" />
            <p className="mt-4 font-semibold">No published events yet</p>
            <p className="text-muted-foreground mt-2 text-sm">
              New events from this organizer will appear here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
