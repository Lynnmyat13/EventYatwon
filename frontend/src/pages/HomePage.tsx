import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  CircleCheck,
  Compass,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EventCard } from "@/components/EventCard";
import { EventSpotlight } from "@/components/EventSpotlight";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TrendingCategoriesMarquee } from "@/components/TrendingCategoriesMarquee";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getEvents, getPublicEventStats } from "@/services/events";
import { getMyFavorites } from "@/services/favorites";
import type { EventQuery } from "@/types/events";

const heroImage = "/Home_page_bg.png";
const featuredQuery: EventQuery = { page: 1, sort: "date" };
const numberFormatter = new Intl.NumberFormat();

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list(featuredQuery),
    queryFn: ({ signal }) => getEvents(featuredQuery, signal),
    staleTime: 3 * 60_000,
  });
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: getMyFavorites,
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const statsQuery = useQuery({
    queryKey: queryKeys.events.stats,
    queryFn: getPublicEventStats,
    staleTime: 5 * 60_000,
  });
  const favoriteIds = new Set(
    (favoritesQuery.data ?? []).map((favorite) =>
      typeof favorite.event === "string"
        ? favorite.event
        : favorite.event._id,
    ),
  );
  const featuredEvents = eventsQuery.data?.events.slice(0, 4) ?? [];
  const eventPreviews = featuredEvents
    .filter((event) => event.banner)
    .slice(0, 4);
  const stats = statsQuery.data;

  const submitHeroSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = String(
      new FormData(event.currentTarget).get("search") ?? "",
    ).trim();
    navigate(search ? `/events?search=${encodeURIComponent(search)}` : "/events");
  };

  return (
    <>
      <section className="relative isolate flex min-h-[calc(100dvh-8rem)] overflow-hidden bg-zinc-950 text-white">
        <img
          src={heroImage}
          alt="Crowd watching a live performance under stage lights"
          className="home-hero-image absolute inset-0 -z-20 size-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,7,18,0.96)_0%,rgba(3,7,18,0.78)_42%,rgba(3,7,18,0.2)_76%),linear-gradient(0deg,rgba(3,7,18,0.95)_0%,transparent_50%)]" />

        <div className="mx-auto flex w-full max-w-7xl flex-col justify-end px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <ScrollReveal className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-md">
              <Sparkles className="size-4 text-cyan-300" />
              Local events. Real people. Memorable experiences.
            </p>
            <h1 className="mt-7 max-w-2xl text-5xl leading-[0.98] font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
              Find your next{" "}
              <span className="bg-linear-to-r from-violet-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                gathering
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-200">
              Discover local events, meet your people, and make plans worth
              remembering.
            </p>

            <form
              onSubmit={submitHeroSearch}
              className="mt-8 flex max-w-3xl flex-col gap-2 rounded-md border border-white/20 bg-white p-2 shadow-2xl sm:flex-row"
            >
              <label htmlFor="hero-event-search" className="sr-only">
                Search for events
              </label>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-zinc-500" />
                <input
                  id="hero-event-search"
                  name="search"
                  type="search"
                  placeholder="Search events or interests"
                  className="h-12 w-full bg-transparent pr-3 pl-11 text-sm text-zinc-950 outline-none placeholder:text-zinc-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
              >
                Explore events <ArrowRight className="size-4" />
              </button>
            </form>

            {stats?.categories.length ? (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Event categories">
                {stats.categories.slice(0, 6).map((category) => (
                  <Link
                    key={category}
                    to={`/events?category=${encodeURIComponent(category)}`}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 text-xs font-medium text-zinc-200 backdrop-blur-md transition-colors hover:border-blue-400/60 hover:text-white"
                  >
                    <Tag className="size-3.5 text-blue-300" /> {category}
                  </Link>
                ))}
              </div>
            ) : null}
          </ScrollReveal>

          <ScrollReveal
            delay={140}
            className="mt-10 grid gap-6 border-t border-white/15 pt-7 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_1.45fr] lg:items-center"
          >
            {[
              {
                value: stats?.publishedEvents,
                label: "Published events",
                icon: Compass,
              },
              {
                value: stats?.registrations,
                label: "Registrations made",
                icon: UsersRound,
              },
              {
                value: stats?.categories.length,
                label: "Event categories",
                icon: Tag,
              },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="size-5 shrink-0 text-cyan-300" />
                <div>
                  <p className="text-2xl font-semibold">
                    {typeof value === "number"
                      ? numberFormatter.format(value)
                      : "-"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">{label}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
              <div>
                <p className="text-2xl font-semibold">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : "-"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">Average rating</p>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:justify-end">
              {eventPreviews.length > 0 && (
                <div className="flex -space-x-3" aria-hidden="true">
                  {eventPreviews.map((event) => (
                    <img
                      key={event._id}
                      src={event.banner ?? undefined}
                      alt=""
                      className="size-10 rounded-full border-2 border-[#070b16] object-cover"
                    />
                  ))}
                </div>
              )}
              <p className="max-w-32 text-sm leading-5 text-zinc-300">
                Explore a growing event community
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <EventSpotlight events={featuredEvents} />
      <TrendingCategoriesMarquee categories={stats?.categories ?? []} />

      <section className="border-b border-white/10 bg-[#070b16] text-white">
        <ScrollReveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Featured events
              </h2>
              <p className="mt-3 text-zinc-400">
                Handpicked experiences waiting to be discovered.
              </p>
            </div>
            <Link
              to="/events"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300 sm:flex"
            >
              View all events <ArrowRight className="size-4" />
            </Link>
          </div>

          {eventsQuery.isPending ? (
            <div
              className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="Loading featured events"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-md border border-white/10 bg-[#0d1424]"
                >
                  <div className="aspect-video animate-pulse bg-white/8" />
                  <div className="space-y-4 p-5">
                    <div className="h-4 w-2/5 animate-pulse rounded bg-white/8" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-white/8" />
                    <div className="h-4 w-3/5 animate-pulse rounded bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length ? (
            <div className="mt-8 grid gap-5 [--background:#0d1424] [--card:#0d1424] [--card-foreground:#fff] [--foreground:#fff] [--muted:#182235] [--muted-foreground:#a1a1aa] [--primary:#60a5fa] sm:grid-cols-2 xl:grid-cols-4">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  isFavorite={user ? favoriteIds.has(event._id) : undefined}
                  isFavoriteLoading={Boolean(user) && favoritesQuery.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border-y border-white/10 py-12 text-center">
              <CalendarCheck className="mx-auto size-7 text-blue-400" />
              <h3 className="mt-4 text-lg font-semibold">
                {eventsQuery.isError
                  ? "Featured events are unavailable"
                  : "No featured events yet"}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                {eventsQuery.isError
                  ? "Browse all events or try again shortly."
                  : "Published events will appear here."}
              </p>
            </div>
          )}

          <Link
            to="/events"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 sm:hidden"
          >
            View all events <ArrowRight className="size-4" />
          </Link>
        </ScrollReveal>
      </section>

      <section className="bg-[#070b16] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <ScrollReveal>
            <div>
              <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                How EventYatwon works
              </h2>
              <p className="mt-3 text-zinc-400">
                From discovery to unforgettable experiences, in just a few steps.
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Discover events",
                description:
                  "Explore events near you, search by interest, and find your next experience.",
              },
              {
                icon: CalendarCheck,
                title: "Register and plan",
                description:
                  "Choose your ticket, register securely, and keep every plan together.",
              },
              {
                icon: UsersRound,
                title: "Attend and enjoy",
                description:
                  "Show your digital ticket, check in quickly, and make memories.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="grid min-h-36 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-white/10 bg-white/4 p-5"
              >
                <span className="grid size-11 place-items-center rounded-full bg-blue-600 text-white">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    {description}
                  </p>
                </div>
                <ArrowRight className="size-4 text-zinc-500" />
              </article>
            ))}
            </div>
          </ScrollReveal>

          <ScrollReveal
            delay={80}
            className="mt-12 grid overflow-hidden rounded-md border border-white/10 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="relative min-h-80 overflow-hidden lg:min-h-125">
              <img
                src="/Hero_bg1.png"
                alt="An attendee enjoying a colorful live event"
                className="absolute inset-0 size-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
              <p className="absolute right-7 bottom-7 max-w-52 text-right text-2xl leading-tight font-semibold text-white sm:text-3xl">
                More people.
                <br />
                More stories.
              </p>
            </div>

            <div className="bg-[#0a0f1d] p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold text-blue-400">
                Why choose EventYatwon?
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal">
                Everything you need to join in.
              </h2>
              <div className="mt-8 grid gap-px overflow-hidden rounded-md bg-white/10 sm:grid-cols-2">
                {[
                  {
                    icon: CircleCheck,
                    title: "Organized events",
                    description: "Clear event details, tickets, and updates.",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Real connections",
                    description: "Meet people who share your interests.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Trusted experience",
                    description: "Secure accounts and protected tickets.",
                  },
                  {
                    icon: MapPin,
                    title: "Local experiences",
                    description: "Find events happening around you.",
                  },
                ].map(({ icon: Icon, title, description }) => (
                  <article key={title} className="bg-[#0d1424] p-5">
                    <Icon className="size-5 text-cyan-400" strokeWidth={1.8} />
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal
            delay={80}
            className="relative mt-6 isolate overflow-hidden rounded-md border border-white/10"
          >
            <img
              src="/Hero_bg2.png"
              alt="An organizer overlooking a live event stage"
              className="absolute inset-0 -z-20 size-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#08101f] via-[#08101f]/90 to-[#08101f]/35" />
            <div className="max-w-2xl px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <p className="text-sm font-semibold text-blue-300">
                Are you an event organizer?
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Bring your events to life with EventYatwon.
              </h2>
              <ul className="mt-6 grid gap-3 text-sm text-zinc-200 sm:grid-cols-2">
                {[
                  [CalendarPlus, "Create and publish events"],
                  [TicketCheck, "Manage tickets and attendees"],
                  [Compass, "Reach people looking for events"],
                  [CircleCheck, "Track check-ins and performance"],
                ].map(([Icon, label]) => (
                  <li key={label as string} className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-blue-400" />
                    {label as string}
                  </li>
                ))}
              </ul>
              <Link
                to="/events/create"
                className={cn(
                  buttonVariants(),
                  "mt-8 h-11 bg-blue-500 px-5 text-white hover:bg-blue-400",
                )}
              >
                Create an event <ArrowRight className="size-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
