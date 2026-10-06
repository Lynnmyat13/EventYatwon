import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { EventCard } from "@/components/EventCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getMyFavorites } from "@/services/favorites";
import type { Event } from "@/types/events";
import type { Favorite } from "@/types/favorites";

const EventSkeleton = () => (
  <div className="bg-card overflow-hidden rounded-lg border" aria-hidden="true">
    <div className="bg-muted aspect-video animate-pulse motion-reduce:animate-none" />
    <div className="space-y-4 p-5">
      <div className="bg-muted h-4 w-2/5 animate-pulse rounded" />
      <div className="bg-muted h-7 w-4/5 animate-pulse rounded" />
      <div className="bg-muted h-20 animate-pulse rounded" />
    </div>
  </div>
);

export function SavedEventsPage() {
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: getMyFavorites,
    staleTime: 60_000,
  });

  const saved = (favoritesQuery.data ?? []).filter(
    (favorite): favorite is Favorite & { event: Event } =>
      typeof favorite.event !== "string" && Boolean(favorite.event),
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-semibold">Your shortlist</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
          Saved events
        </h1>
        <p className="text-muted-foreground mt-4 leading-7">
          Keep track of events you want to revisit.
        </p>
      </div>

      {favoritesQuery.isPending ? (
        <div
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading saved events"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <EventSkeleton key={index} />
          ))}
        </div>
      ) : favoritesQuery.isError ? (
        <div className="mt-10 grid min-h-72 place-items-center border-y text-center">
          <div>
            <AlertCircle className="text-destructive mx-auto size-9" />
            <h2 className="mt-4 text-xl font-semibold">
              Could not load favorites
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Your saved events could not be loaded.
            </p>
            <Button
              className="mt-5"
              onClick={() => void favoritesQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : saved.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((favorite) => (
            <EventCard key={favorite._id} event={favorite.event} isFavorite />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid min-h-72 place-items-center border-y text-center">
          <div className="max-w-sm">
            <Heart className="text-primary mx-auto size-10" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold">No saved events</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Use the heart button to keep interesting events here.
            </p>
            <Link to="/events" className={cn(buttonVariants(), "mt-5")}>
              Explore events
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
