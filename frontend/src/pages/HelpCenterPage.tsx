import { useState } from "react";
import {
  CalendarCheck,
  ChevronDown,
  CircleHelp,
  Search,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

const sections = [
  {
    title: "Registration",
    icon: CalendarCheck,
    items: [
      {
        question: "How do I register for an event?",
        answer:
          "Open a published event, choose an available ticket type and quantity, then confirm your registration. Registration is available to attendee accounts.",
      },
      {
        question: "Can I register more than once?",
        answer:
          "Each attendee can keep one active registration per event. If a previous registration was cancelled, registering again reactivates it with your new ticket choice.",
      },
      {
        question: "How do I cancel a registration?",
        answer:
          "Open My Events or your registration confirmation page and choose Cancel registration. Your active tickets are cancelled at the same time.",
      },
    ],
  },
  {
    title: "Tickets and check-in",
    icon: TicketCheck,
    items: [
      {
        question: "Where can I find my tickets?",
        answer:
          "Sign in with your attendee account and open My Tickets. Each ticket includes its event details, ticket code, and secure QR code.",
      },
      {
        question: "Can I use a screenshot of my QR code?",
        answer:
          "Your organizer scans the secure QR token attached to your ticket. Keep your ticket private and only present it when you are ready to check in.",
      },
      {
        question: "Why does my ticket show as checked in?",
        answer:
          "A checked-in ticket has already been accepted by the organizer. If you believe this happened by mistake, contact the organizer from the event page.",
      },
    ],
  },
  {
    title: "Events and accounts",
    icon: ShieldCheck,
    items: [
      {
        question: "Who can create events?",
        answer:
          "Organizer accounts can create, publish, update, and manage events. Attendee accounts are designed for discovery, registration, saved events, and tickets.",
      },
      {
        question: "How do I update my name or email?",
        answer:
          "Open Account settings from the profile menu. Your updated name is used across registrations, tickets, reviews, and organizer information.",
      },
      {
        question: "How are my account and tickets protected?",
        answer:
          "EventYatwon uses role-based access, hashed passwords, protected API routes, unique ticket codes, and secure QR tokens.",
      },
    ],
  },
] as const;

export function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !term ||
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term),
      ),
    }))
    .filter((section) => section.items.length);

  return (
    <main>
      <section className="bg-muted/35 border-b">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-primary flex items-center gap-2 text-sm font-semibold">
              <CircleHelp className="size-4" /> Help center
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Clear answers for every event step.
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">
              Learn how registration, digital tickets, accounts, and organizer
              tools work.
            </p>
            <label htmlFor="help-search" className="sr-only">
              Search help articles
            </label>
            <div className="relative mt-8 max-w-2xl">
              <Search className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />
              <Input
                id="help-search"
                type="search"
                value={search}
                placeholder="Search registration, tickets, or accounts"
                className="bg-background h-13 pl-12 text-base"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {filtered.length ? (
          <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside>
              <h2 className="text-sm font-semibold">Help topics</h2>
              <nav className="mt-4 space-y-2" aria-label="Help topics">
                {filtered.map(({ title, icon: Icon }) => (
                  <a
                    key={title}
                    href={`#${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-3 py-2 text-sm font-medium"
                  >
                    <Icon className="text-primary size-4" /> {title}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="space-y-12">
              {filtered.map(({ title, icon: Icon, items }) => (
                <section
                  key={title}
                  id={title.toLowerCase().replace(/[^a-z]+/g, "-")}
                  className="scroll-mt-24"
                >
                  <div className="flex items-center gap-3 border-b pb-4">
                    <Icon className="text-primary size-5" />
                    <h2 className="text-2xl font-semibold">{title}</h2>
                  </div>
                  <div className="mt-2">
                    {items.map((item) => (
                      <details key={item.question} className="group border-b">
                        <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-semibold focus-visible:ring-2 focus-visible:outline-none">
                          {item.question}
                          <ChevronDown className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="text-muted-foreground max-w-3xl pb-5 leading-7">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-16 text-center">
            <Search className="text-muted-foreground mx-auto size-8" />
            <p className="mt-4 font-semibold">No matching help articles</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Try a shorter search or send your question to support.
            </p>
            <Link
              to="/contact"
              className="text-primary mt-5 inline-block text-sm font-semibold hover:underline"
            >
              Contact support
            </Link>
          </div>
        )}
      </section>

      <section className="bg-muted/35 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">Still need help?</h2>
            <p className="text-muted-foreground mt-2">
              Send the support team the details and we will review your request.
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
          >
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
