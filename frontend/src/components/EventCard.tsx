import { useState } from "react";
import { CalendarDays, ImageOff, MapPin, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatTicketPrice } from "@/lib/currency";
import type { Event } from "@/types/events";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const eventPrice = (event: Event): string => {
  if (!event.ticketTypes.length) return "Price TBA";
  const lowestPrice = Math.min(
    ...event.ticketTypes.map((ticket) => ticket.price),
  );
  return lowestPrice === 0 ? "Free" : `From ${formatTicketPrice(lowestPrice)}`;
};

interface EventCardProps {
  event: Event;
  isFavorite?: boolean;
  isFavoriteLoading?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export function EventCard({
  event,
  isFavorite,
  isFavoriteLoading,
  onFavoriteChange,
}: EventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(event.banner) && !imageFailed;

  return (
    <article className="group bg-card text-card-foreground hover:border-primary/50 relative h-full overflow-hidden rounded-lg border transition-colors">
      <FavoriteButton
        eventId={event._id}
        eventSlug={event.slug}
        initialFavorite={isFavorite}
        isStatusLoading={isFavoriteLoading}
        className="bg-background/95 absolute top-3 right-3 z-10 shadow-sm"
        onChange={onFavoriteChange}
      />
      <Link
        to={`/events/${event.slug}`}
        className="focus-visible:ring-ring/40 flex h-full flex-col focus-visible:ring-3 focus-visible:outline-none"
      >
        <div className="bg-muted relative aspect-video overflow-hidden">
          {hasImage ? (
            <img
              src={event.banner ?? undefined}
              alt={`${event.title} banner`}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="text-muted-foreground grid size-full place-items-center">
              <ImageOff
                aria-hidden="true"
                className="size-8"
                strokeWidth={1.4}
              />
            </div>
          )}
          <span className="bg-background/95 text-foreground absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-semibold shadow-sm">
            {event.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="text-primary flex items-center gap-2 text-sm font-medium">
            <CalendarDays
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.8}
            />
            <time dateTime={event.startDate}>
              {dateFormatter.format(new Date(event.startDate))}
            </time>
          </div>
          <h2 className="text-foreground group-hover:text-primary mt-3 line-clamp-2 text-xl leading-7 font-semibold tracking-normal">
            {event.title}
          </h2>
          <p className="text-muted-foreground mt-2 line-clamp-2 min-h-12 text-sm leading-6">
            {event.description}
          </p>
          <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t pt-4">
            <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
              <MapPin
                aria-hidden="true"
                className="size-4 shrink-0"
                strokeWidth={1.8}
              />
              <span className="truncate">{event.venue.name}</span>
            </div>
            <div className="text-foreground flex shrink-0 items-center gap-1.5 justify-self-end text-right text-sm font-semibold">
              <Ticket
                aria-hidden="true"
                className="text-muted-foreground size-4"
                strokeWidth={1.8}
              />
              {eventPrice(event)}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
