import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Ticket,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatTicketPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/events";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const numberFormatter = new Intl.NumberFormat();

const ticketPrice = (event: Event): string => {
  if (!event.ticketTypes.length) return "Price TBA";
  const price = Math.min(...event.ticketTypes.map((ticket) => ticket.price));
  return price === 0 ? "Free" : `From ${formatTicketPrice(price)}`;
};

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 56 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -36 }),
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42 } },
};

export function EventSpotlight({ events }: { events: Event[] }) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabActive, setIsTabActive] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );

  useEffect(() => {
    const updateVisibility = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  if (!events.length) return null;

  const safeIndex = index % events.length;
  const event = events[safeIndex];
  const canChange = events.length > 1;
  const isPaused = isHovered || !isTabActive || Boolean(reducedMotion);

  const changeSlide = (nextDirection: number) => {
    if (!canChange) return;
    setDirection(nextDirection);
    setIndex(
      (current) => (current + nextDirection + events.length) % events.length,
    );
  };

  return (
    <section className="bg-[#070b16] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
      <motion.div
        className="event-spotlight relative mx-auto max-w-7xl overflow-hidden rounded-[8px] border border-white/10 bg-[#0a1020] shadow-[0_24px_80px_rgba(37,99,235,0.15)]"
        tabIndex={0}
        aria-label="Event spotlight carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsHovered(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsHovered(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") changeSlide(-1);
          if (event.key === "ArrowRight") changeSlide(1);
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={`glow-${event._id}`}
            className="pointer-events-none absolute inset-0 opacity-25 blur-3xl"
            style={
              event.banner
                ? {
                    backgroundImage: `url(${event.banner})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : { backgroundColor: "#2563eb" }
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 1.1 }}
          />
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.article
            key={event._id}
            custom={direction}
            variants={reducedMotion ? undefined : slideVariants}
            initial={reducedMotion ? false : "enter"}
            animate="center"
            exit={reducedMotion ? undefined : "exit"}
            transition={{
              duration: reducedMotion ? 0 : 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            drag={reducedMotion || !canChange ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragEnd={(_event, info) => {
              if (info.offset.x < -60) changeSlide(1);
              if (info.offset.x > 60) changeSlide(-1);
            }}
            className="relative grid touch-pan-y lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="relative min-h-72 overflow-hidden sm:min-h-96 lg:min-h-150">
              {event.banner ? (
                <img
                  src={event.banner}
                  alt={`${event.title} banner`}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#111a2d]" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-[#080d19] via-transparent to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-transparent lg:to-[#0a1020]" />
            </div>

            <motion.div
              variants={reducedMotion ? undefined : contentVariants}
              initial={reducedMotion ? false : "hidden"}
              animate="visible"
              className="relative flex flex-col justify-center p-6 sm:p-9 lg:p-12"
            >
              <motion.span
                variants={reducedMotion ? undefined : itemVariants}
                className="w-fit rounded-md border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300"
              >
                {event.category}
              </motion.span>
              <motion.h2
                variants={reducedMotion ? undefined : itemVariants}
                className="mt-5 text-3xl leading-tight font-semibold tracking-normal sm:text-4xl lg:text-5xl"
              >
                {event.title}
              </motion.h2>

              <motion.dl
                variants={reducedMotion ? undefined : itemVariants}
                className="mt-7 grid gap-4 text-sm text-zinc-300 sm:grid-cols-2"
              >
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-blue-400" />
                  <div>
                    <dt className="sr-only">Date and time</dt>
                    <dd>{dateFormatter.format(new Date(event.startDate))}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                  <div className="min-w-0">
                    <dt className="sr-only">Venue</dt>
                    <dd className="font-medium text-white">
                      {event.venue.name}
                    </dd>
                    <dd className="mt-0.5 text-xs text-zinc-500">
                      {event.venue.address}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <UsersRound className="mt-0.5 size-4 shrink-0 text-violet-400" />
                  <div>
                    <dt className="sr-only">Attendees</dt>
                    <dd>
                      {numberFormatter.format(event.registeredCount)} attending
                      <span className="text-zinc-500">
                        {" "}
                        / {numberFormatter.format(event.capacity)} capacity
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Ticket className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <div>
                    <dt className="sr-only">Ticket price</dt>
                    <dd className="font-semibold text-white">
                      {ticketPrice(event)}
                    </dd>
                  </div>
                </div>
              </motion.dl>

              <motion.div
                variants={reducedMotion ? undefined : itemVariants}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <Link
                  to={`/events/${event.slug}`}
                  className={cn(
                    buttonVariants(),
                    "h-11 bg-blue-600 px-5 text-white hover:bg-blue-500",
                  )}
                >
                  View event <ArrowRight className="size-4" />
                </Link>
                <span className="ml-auto font-mono text-sm text-zinc-500">
                  {String(safeIndex + 1).padStart(2, "0")} /{" "}
                  {String(events.length).padStart(2, "0")}
                </span>
              </motion.div>
            </motion.div>
          </motion.article>
        </AnimatePresence>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 hover:text-white"
            disabled={!canChange}
            aria-label="Previous event"
            title="Previous event"
            onClick={() => changeSlide(-1)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-white/20 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 hover:text-white"
            disabled={!canChange}
            aria-label="Next event"
            title="Next event"
            onClick={() => changeSlide(1)}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/8">
          <div
            key={`progress-${event._id}`}
            className={cn(
              "event-spotlight-progress h-full origin-left bg-linear-to-r from-blue-500 via-violet-500 to-cyan-400",
              !canChange && "w-full",
            )}
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
            onAnimationEnd={() => {
              if (!isPaused) changeSlide(1);
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
