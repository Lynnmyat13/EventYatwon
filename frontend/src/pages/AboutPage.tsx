import {
  ArrowRight,
  CalendarCheck,
  ShieldCheck,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  {
    icon: CalendarCheck,
    title: "Simple by design",
    description:
      "Discovery, registration, tickets, and check-in stay connected in one clear experience.",
    className: "bg-blue-600 text-white lg:row-span-2",
  },
  {
    icon: UsersRound,
    title: "Built for both sides",
    description:
      "Attendees make plans confidently while organizers get practical tools to run their events.",
    className: "border border-white/10 bg-[#0d1424] text-white",
  },
  {
    icon: ShieldCheck,
    title: "Trust at every step",
    description:
      "Role-based access and secure digital tickets help protect event and attendee information.",
    className: "border border-white/10 bg-white/5 text-white",
  },
] as const;

export function AboutPage() {
  return (
    <main className="bg-[#070b16] text-white">
      <section className="relative isolate flex min-h-[calc(100dvh-4.5rem)] items-center overflow-hidden">
        <img
          src="/About_bg.png"
          alt="Audience watching a speaker at a live event"
          className="absolute inset-0 -z-20 size-full object-cover object-[68%_center] sm:object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,7,18,0.92)_0%,rgba(3,7,18,0.72)_38%,rgba(3,7,18,0.12)_72%),linear-gradient(0deg,rgba(3,7,18,0.88)_0%,transparent_46%)]" />

        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-blue-300 uppercase">
              About EventYatwon
            </p>
            <h1 className="mt-5 text-5xl leading-[0.98] font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Everything your event needs, connected.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-200">
              One dependable place for event discovery, registration, digital
              tickets, and organizer operations.
            </p>
            <Link
              to="/events"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none active:translate-y-px"
            >
              Explore events <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="purpose" className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-300">Our purpose</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Fewer barriers between an idea and a full room.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              EventYatwon brings the whole event journey into one focused
              platform, so every step stays clear before, during, and after the
              event.
            </p>
          </div>

          <div className="mt-12 grid border-y border-white/10 md:grid-cols-2 md:divide-x md:divide-white/10">
            <article className="py-8 md:pr-10 lg:py-10 lg:pr-16">
              <UsersRound className="size-6 text-blue-300" strokeWidth={1.7} />
              <h3 className="mt-6 text-2xl font-semibold">For attendees</h3>
              <p className="mt-3 max-w-lg leading-7 text-zinc-400">
                Find relevant events, register with confidence, and keep secure
                digital tickets ready when it is time to check in.
              </p>
            </article>
            <article className="border-t border-white/10 py-8 md:border-t-0 md:pl-10 lg:py-10 lg:pl-16">
              <TicketCheck className="size-6 text-blue-300" strokeWidth={1.7} />
              <h3 className="mt-6 text-2xl font-semibold">For organizers</h3>
              <p className="mt-3 max-w-lg leading-7 text-zinc-400">
                Publish events, understand attendance, manage check-ins, and
                keep guests informed from one practical workspace.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Built around what matters.
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:grid-rows-2">
            {values.map(({ icon: Icon, title, description, className }) => (
              <article
                key={title}
                className={`${className} flex min-h-64 flex-col justify-between rounded-lg p-7 sm:p-9`}
              >
                <Icon className="size-7" strokeWidth={1.6} />
                <div className="mt-16">
                  <h3 className="text-2xl font-semibold">{title}</h3>
                  <p
                    className={`mt-3 max-w-lg leading-7 ${title === "Simple by design" ? "text-blue-50" : "text-zinc-400"}`}
                  >
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8 lg:py-20">
          <div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Find an event worth showing up for.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-zinc-400">
              Browse upcoming experiences and make your next plan.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md border border-white/15 bg-white px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none active:translate-y-px"
          >
            Explore events <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
