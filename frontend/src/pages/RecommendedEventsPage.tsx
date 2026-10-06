import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { EventCard } from "@/components/EventCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getEventErrorMessage, getRecommendedEvents } from "@/services/events";
import { getMyFavorites } from "@/services/favorites";

export function RecommendedEventsPage() {
  const recommendationsQuery = useQuery({
    queryKey: queryKeys.recommendations.all,
    queryFn: getRecommendedEvents,
    staleTime: 2 * 60_000,
  });
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: getMyFavorites,
    staleTime: 60_000,
  });
  const favoriteIds = new Set(
    (favoritesQuery.data ?? []).map((favorite) =>
      typeof favorite.event === "string" ? favorite.event : favorite.event._id,
    ),
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-primary flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4" /> Recommended for you
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          More events that match your interests.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">
          Recommendations use the categories you save and attend, while keeping
          registered events out of the way.
        </p>
      </header>

      {recommendationsQuery.isPending ? (
        <div
          className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading recommended events"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border">
              <div className="bg-muted aspect-video animate-pulse motion-reduce:animate-none" />
              <div className="space-y-4 p-5">
                <div className="bg-muted h-4 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
                <div className="bg-muted h-6 w-4/5 animate-pulse rounded motion-reduce:animate-none" />
                <div className="bg-muted h-4 w-3/5 animate-pulse rounded motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendationsQuery.isError ? (
        <div className="mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
          <AlertCircle className="text-destructive mx-auto size-9" />
          <p className="mt-4 font-semibold">Recommendations are unavailable</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {getEventErrorMessage(
              recommendationsQuery.error,
              "Recommended events could not be loaded.",
            )}
          </p>
          <Button
            className="mt-5"
            onClick={() => void recommendationsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : recommendationsQuery.data.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {recommendationsQuery.data.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              isFavorite={favoriteIds.has(event._id)}
              isFavoriteLoading={favoritesQuery.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
          <Compass className="text-muted-foreground mx-auto size-9" />
          <p className="mt-4 text-lg font-semibold">
            We need a little more to work with
          </p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
            Save an event or register for one, then your recommendations will
            become more personal.
          </p>
          <Link to="/events" className={cn(buttonVariants(), "mt-6 h-10 px-4")}>
            Explore events
          </Link>
        </div>
      )}
    </main>
  );
}
