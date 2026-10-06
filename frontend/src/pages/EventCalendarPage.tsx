import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getCalendarEvents, getEventErrorMessage } from "@/services/events";
import type { Event } from "@/types/events";

const monthTitle = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});
const dayTitle = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const time = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseMonth = (value: string | null, fallback: Date): Date => {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, 1);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
};

const eventsForDay = (events: Event[], date: Date): Event[] => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return events.filter(
    (event) =>
      new Date(event.startDate) < end && new Date(event.endDate) >= start,
  );
};

export function EventCalendarPage() {
  const [params, setParams] = useSearchParams();
  const [today] = useState(() => new Date());
  const selectedMonth = parseMonth(params.get("month"), today);
  const firstDay = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1,
  );
  const lastDay = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0,
  );
  const from = dateKey(firstDay);
  const to = dateKey(lastDay);
  const calendarQuery = useQuery({
    queryKey: queryKeys.events.calendar(from, to),
    queryFn: ({ signal }) => getCalendarEvents(from, to, signal),
    staleTime: 3 * 60_000,
  });
  const events = calendarQuery.data ?? [];
  const leadingDays = firstDay.getDay();
  const cellCount = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(index - leadingDays + 1);
    return date;
  });
  const activeDays = days.filter(
    (date) =>
      date.getMonth() === selectedMonth.getMonth() &&
      eventsForDay(events, date).length,
  );
  const todayKey = dateKey(today);

  const selectMonth = (offset: number) => {
    const next = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + offset,
      1,
    );
    setParams({ month: dateKey(next).slice(0, 7) });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="bg-card grid overflow-hidden rounded-2xl border lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="px-6 py-9 sm:px-9 sm:py-11 lg:px-12">
          <div className="text-primary flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4" />
            Event calendar
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Make room for something memorable.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7 sm:text-lg">
            Browse published events by date and find the right plan for your
            month.
          </p>
        </div>
        <div className="bg-muted/45 flex flex-col justify-between border-t p-6 lg:border-t-0 lg:border-l lg:p-8">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              {monthTitle.format(selectedMonth)}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {calendarQuery.isPending ? "…" : events.length}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {events.length === 1 ? "published event" : "published events"}
            </p>
          </div>
          <Link
            to="/events"
            className="text-primary mt-8 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            Browse all events
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="calendar-month">
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Viewing month</p>
            <h2
              id="calendar-month"
              className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {monthTitle.format(selectedMonth)}
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              className="mr-1"
              onClick={() => setParams({ month: dateKey(today).slice(0, 7) })}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => selectMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => selectMonth(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {calendarQuery.isPending ? (
          <div
            className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-7"
            aria-label="Loading event calendar"
          >
            {Array.from({ length: 14 }, (_, index) => (
              <div
                key={index}
                className="bg-muted h-32 animate-pulse rounded-xl motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : calendarQuery.isError ? (
          <div className="mt-8 rounded-xl border border-dashed px-6 py-14 text-center">
            <AlertCircle className="text-destructive mx-auto size-9" />
            <p className="mt-4 font-semibold">Calendar could not be loaded</p>
            <p className="text-muted-foreground mt-2 text-sm">
              {getEventErrorMessage(calendarQuery.error)}
            </p>
            <Button
              className="mt-5"
              onClick={() => void calendarQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-card mt-6 hidden overflow-hidden rounded-xl border md:block">
              <div className="bg-muted/45 grid grid-cols-7 border-b">
                {weekdays.map((weekday) => (
                  <div
                    key={weekday}
                    className="text-muted-foreground px-3 py-3 text-xs font-semibold"
                  >
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((date) => {
                  const dayEvents = eventsForDay(events, date);
                  const inMonth = date.getMonth() === selectedMonth.getMonth();
                  const key = dateKey(date);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "group hover:bg-muted/20 min-h-40 border-r border-b p-2.5 transition-colors",
                        !inMonth && "bg-muted/20 text-muted-foreground/70",
                      )}
                    >
                      <time
                        dateTime={key}
                        aria-current={key === todayKey ? "date" : undefined}
                        className={cn(
                          "grid size-8 place-items-center rounded-lg text-sm font-medium",
                          key === todayKey &&
                            "bg-primary text-primary-foreground font-semibold",
                        )}
                      >
                        {date.getDate()}
                      </time>
                      <div className="mt-2 space-y-1.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <Link
                            key={event._id}
                            to={`/events/${event.slug}`}
                            title={event.title}
                            className="border-primary/15 bg-primary/8 hover:border-primary/30 hover:bg-primary/12 block rounded-lg border px-2 py-2 text-xs transition-colors"
                          >
                            <span className="text-foreground block truncate font-semibold">
                              {event.title}
                            </span>
                            <span className="text-primary mt-1 flex items-center gap-1 text-[11px]">
                              <Clock3 className="size-3" />
                              {time.format(new Date(event.startDate))}
                            </span>
                          </Link>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-muted-foreground px-2 text-xs">
                            +{dayEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-3 md:hidden">
              {activeDays.length ? (
                activeDays.map((date) => (
                  <section
                    key={dateKey(date)}
                    className="bg-card overflow-hidden rounded-xl border"
                  >
                    <div className="bg-muted/35 flex items-center justify-between border-b px-4 py-3">
                      <h3 className="font-semibold">{dayTitle.format(date)}</h3>
                      <span className="text-muted-foreground text-xs font-medium">
                        {eventsForDay(events, date).length}{" "}
                        {eventsForDay(events, date).length === 1
                          ? "event"
                          : "events"}
                      </span>
                    </div>
                    <div className="divide-y">
                      {eventsForDay(events, date).map((event) => (
                        <Link
                          key={event._id}
                          to={`/events/${event.slug}`}
                          className="group hover:bg-muted/30 grid grid-cols-[1fr_auto] gap-4 p-4 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {event.title}
                            </p>
                            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 truncate text-sm">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">
                                {event.venue.name}
                              </span>
                            </p>
                          </div>
                          <div className="text-primary flex items-center gap-1.5 self-start text-sm font-medium">
                            <Clock3 className="size-3.5" />
                            {time.format(new Date(event.startDate))}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-xl border border-dashed px-6 py-14 text-center">
                  <CalendarDays className="text-muted-foreground mx-auto size-8" />
                  <p className="mt-4 font-semibold">No events this month</p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Try another month or explore every published event.
                  </p>
                  <Link
                    to="/events"
                    className="bg-primary text-primary-foreground hover:bg-primary/80 mt-5 inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors"
                  >
                    Explore events
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
