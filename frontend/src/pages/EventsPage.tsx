import type { FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownUp,
  Calendar,
  CalendarSearch,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { getEventErrorMessage, getEvents } from "@/services/events";
import { getMyFavorites } from "@/services/favorites";
import type { EventQuery, EventSort } from "@/types/events";

const noFavorites = new Set<string>();

const positivePage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const EventSkeleton = () => (
  <div className="bg-card overflow-hidden rounded-lg border" aria-hidden="true">
    <div className="bg-muted aspect-[16/9] animate-pulse motion-reduce:animate-none" />
    <div className="space-y-4 p-5">
      <div className="bg-muted h-4 w-2/5 animate-pulse rounded motion-reduce:animate-none" />
      <div className="bg-muted h-7 w-4/5 animate-pulse rounded motion-reduce:animate-none" />
      <div className="space-y-2">
        <div className="bg-muted h-4 w-full animate-pulse rounded motion-reduce:animate-none" />
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded motion-reduce:animate-none" />
      </div>
      <div className="bg-muted/50 h-10 animate-pulse border-t motion-reduce:animate-none" />
    </div>
  </div>
);

export function EventsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positivePage(searchParams.get("page"));
  const sort: EventSort =
    searchParams.get("sort") === "newest" ? "newest" : "date";
  const hasFilters = [...searchParams.keys()].some((key) => key !== "page");
  const filters: EventQuery = {
    page,
    sort,
    search: searchParams.get("search") || undefined,
    category: searchParams.get("category") || undefined,
    date: searchParams.get("date") || undefined,
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
  };
  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: ({ signal }) => getEvents(filters, signal),
    staleTime: 3 * 60_000,
    placeholderData: keepPreviousData,
  });
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: getMyFavorites,
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const favoriteIds = user
    ? favoritesQuery.data
      ? new Set(
          favoritesQuery.data.map((favorite) =>
            typeof favorite.event === "string"
              ? favorite.event
              : favorite.event._id,
          ),
        )
      : null
    : noFavorites;

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("search") ?? "",
    ).trim();
    setFilter("search", value);
  };

  const data = eventsQuery.data;
  const error = eventsQuery.error
    ? getEventErrorMessage(eventsQuery.error)
    : undefined;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-semibold">
          Discover what is happening
        </p>
        <h1 className="text-foreground mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
          Explore events
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          Find published events by name, category, date, and price.
        </p>
      </div>

      <div className="bg-muted/25 mt-10 border-y py-5">
        <form
          onSubmit={submitSearch}
          className="grid gap-4 lg:grid-cols-[minmax(16rem,2fr)_1fr_1fr_1fr_1fr_auto] lg:items-end"
        >
          <div>
            <label
              htmlFor="event-search"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Search
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  key={searchParams.get("search") ?? ""}
                  id="event-search"
                  name="search"
                  defaultValue={searchParams.get("search") ?? ""}
                  placeholder="Search event titles"
                  className="pl-9"
                />
              </div>
              <Button type="submit" className="h-11 px-4">
                Search
              </Button>
            </div>
          </div>

          <div>
            <label
              htmlFor="event-category"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Category
            </label>
            <Input
              id="event-category"
              value={searchParams.get("category") ?? ""}
              placeholder="Any category"
              onChange={(event) => setFilter("category", event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="event-date"
              className="text-foreground mb-2 flex items-center gap-1.5 text-sm font-medium"
            >
              <Calendar
                aria-hidden="true"
                className="text-muted-foreground size-4"
              />{" "}
              Date
            </label>
            <Input
              id="event-date"
              type="date"
              value={searchParams.get("date") ?? ""}
              onChange={(event) => setFilter("date", event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="event-min-price"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Minimum price
            </label>
            <Input
              id="event-min-price"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={searchParams.get("minPrice") ?? ""}
              placeholder="No minimum"
              onChange={(event) => setFilter("minPrice", event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="event-max-price"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Maximum price
            </label>
            <Input
              id="event-max-price"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={searchParams.get("maxPrice") ?? ""}
              placeholder="No maximum"
              onChange={(event) => setFilter("maxPrice", event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="event-sort"
              className="text-foreground mb-2 flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowDownUp
                aria-hidden="true"
                className="text-muted-foreground size-4"
              />{" "}
              Sort
            </label>
            <select
              id="event-sort"
              value={sort}
              className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/20 h-11 w-full rounded-lg border px-3 text-sm shadow-sm focus-visible:ring-3 focus-visible:outline-none"
              onChange={(event) => setFilter("sort", event.target.value)}
            >
              <option value="date">Event date</option>
              <option value="newest">Newest added</option>
            </select>
          </div>
        </form>

        {hasFilters && (
          <Button
            variant="ghost"
            className="mt-4 h-9 px-2"
            onClick={() => setSearchParams({})}
          >
            <RotateCcw aria-hidden="true" className="size-4" /> Clear filters
          </Button>
        )}
      </div>

      <div className="mt-8 flex min-h-7 items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {data
            ? `${data.pagination.total} event${data.pagination.total === 1 ? "" : "s"}`
            : eventsQuery.isPending
              ? "Loading events"
              : ""}
        </p>
      </div>

      {eventsQuery.isPending ? (
        <div
          className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading events"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <EventSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="mt-5 grid min-h-72 place-items-center border-y py-12 text-center">
          <div className="max-w-md">
            <AlertCircle
              aria-hidden="true"
              className="text-destructive mx-auto size-9"
              strokeWidth={1.6}
            />
            <h2 className="text-foreground mt-4 text-xl font-semibold">
              Could not load events
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {error}
            </p>
            <Button
              className="mt-5 h-10 px-4"
              onClick={() => void eventsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : data?.events.length ? (
        <>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                isFavorite={favoriteIds?.has(event._id)}
                isFavoriteLoading={Boolean(user) && favoritesQuery.isPending}
              />
            ))}
          </div>

          {data.pagination.pages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-4"
              aria-label="Event pages"
            >
              <Button
                variant="outline"
                size="icon-lg"
                disabled={page <= 1}
                aria-label="Previous page"
                title="Previous page"
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <span className="text-muted-foreground min-w-28 text-center text-sm">
                Page <strong className="text-foreground">{page}</strong> of{" "}
                {data.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon-lg"
                disabled={page >= data.pagination.pages}
                aria-label="Next page"
                title="Next page"
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </nav>
          )}
        </>
      ) : (
        <div className="mt-5 grid min-h-72 place-items-center border-y py-12 text-center">
          <div className="max-w-md">
            <CalendarSearch
              aria-hidden="true"
              className="text-primary mx-auto size-10"
              strokeWidth={1.5}
            />
            <h2 className="text-foreground mt-4 text-xl font-semibold">
              {hasFilters ? "No matching events" : "No published events yet"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {hasFilters
                ? "Try changing or clearing your filters."
                : "Published events will appear here."}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                className="mt-5 h-10 px-4"
                onClick={() => setSearchParams({})}
              >
                <RotateCcw aria-hidden="true" className="size-4" /> Clear
                filters
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
