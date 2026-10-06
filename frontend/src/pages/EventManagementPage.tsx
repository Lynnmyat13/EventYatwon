import { useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  ImageOff,
  Info,
  Lightbulb,
  MapPin,
  Plus,
  Rocket,
  RotateCcw,
  Save,
  ScanLine,
  Search,
  Settings,
  Ticket,
  Trash2,
  type LucideIcon,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKyat } from "@/lib/currency";
import { invalidateEventManagementData } from "@/lib/query-invalidation";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  getManagementAttendees,
  getManagementAnalytics,
  getManagementCheckIns,
  getManagementOverview,
  getManagementTickets,
} from "@/services/eventManagement";
import {
  getEventErrorMessage,
  removeEventBanner,
  replaceEventBanner,
  updateEventDetails,
  updateEventStatus,
  updateEventVenue,
} from "@/services/events";
import type { Event } from "@/types/events";
import type {
  ManagementListQuery,
  ManagementOverview,
  ManagementPagination,
} from "@/types/eventManagement";

const tabs = [
  "overview",
  "attendees",
  "tickets",
  "check-ins",
  "analytics",
  "settings",
] as const;
type ManagementTab = (typeof tabs)[number];

const numberFormatter = new Intl.NumberFormat();
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateTimeInputValue = (value: string): string => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const title = (tab: ManagementTab) =>
  tab === "check-ins"
    ? "Check-ins"
    : `${tab.charAt(0).toUpperCase()}${tab.slice(1)}`;

const managementNavigation: Array<{
  tab: ManagementTab;
  icon: LucideIcon;
}> = [
  { tab: "overview", icon: CalendarDays },
  { tab: "attendees", icon: UsersRound },
  { tab: "tickets", icon: Ticket },
  { tab: "check-ins", icon: UserRoundCheck },
  { tab: "analytics", icon: CircleDollarSign },
  { tab: "settings", icon: Settings },
];

function ManagementSidebar({
  eventId,
  activeTab,
}: {
  eventId: string;
  activeTab: ManagementTab;
}) {
  return (
    <aside className="border-border/70 bg-card overflow-hidden rounded-lg border lg:sticky lg:top-24">
      <Link
        to="/organizer/events"
        className="text-muted-foreground hover:text-foreground flex h-14 items-center gap-2 border-b px-4 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to events
      </Link>
      <nav
        className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-3 lg:grid-cols-1"
        aria-label="Event management sections"
      >
        {managementNavigation.map(({ tab, icon: Icon }) => (
          <Link
            key={tab}
            to={`/organizer/events/${eventId}/manage?tab=${tab}`}
            className={cn(
              "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" /> {title(tab)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function Pagination({
  pagination,
  onPage,
}: {
  pagination: ManagementPagination;
  onPage(page: number): void;
}) {
  if (pagination.pages <= 1) return null;
  return (
    <nav
      className="mt-6 flex items-center justify-center gap-4"
      aria-label="Table pages"
    >
      <Button
        variant="outline"
        size="icon-lg"
        aria-label="Previous page"
        disabled={pagination.page <= 1}
        onClick={() => onPage(pagination.page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-muted-foreground min-w-28 text-center text-sm">
        Page <strong className="text-foreground">{pagination.page}</strong> of{" "}
        {pagination.pages}
      </span>
      <Button
        variant="outline"
        size="icon-lg"
        aria-label="Next page"
        disabled={pagination.page >= pagination.pages}
        onClick={() => onPage(pagination.page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 py-4" aria-label="Loading records">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="bg-muted h-14 animate-pulse rounded" />
      ))}
    </div>
  );
}

function ListError({ message }: { message: string }) {
  return (
    <div className="grid min-h-64 place-items-center border-y text-center">
      <div>
        <AlertCircle className="text-destructive mx-auto size-8" />
        <p className="mt-3 font-semibold">Could not load records</p>
        <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      </div>
    </div>
  );
}

function Filters({
  overview,
  search,
  status,
  ticketType,
  checkedIn = "",
  statusOptions,
  includeCheckIn = false,
  onChange,
}: {
  overview: ManagementOverview;
  search: string;
  status: string;
  ticketType: string;
  checkedIn?: string;
  statusOptions: Array<{ value: string; label: string }>;
  includeCheckIn?: boolean;
  onChange(values: {
    search?: string;
    status?: string;
    ticketType?: string;
    checkedIn?: string;
  }): void;
}) {
  const [draftSearch, setDraftSearch] = useState(search);
  return (
    <form
      className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ search: draftSearch });
      }}
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={draftSearch}
          aria-label="Search attendees or tickets"
          placeholder="Search name, email or code"
          className="pl-9"
          onChange={(event) => setDraftSearch(event.target.value)}
        />
      </div>
      {statusOptions.length > 0 && (
        <select
          value={status}
          aria-label="Filter by status"
          className="bg-background h-11 rounded-lg border px-3 text-sm"
          onChange={(event) => onChange({ status: event.target.value })}
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <select
        value={ticketType}
        aria-label="Filter by ticket type"
        className="bg-background h-11 rounded-lg border px-3 text-sm"
        onChange={(event) => onChange({ ticketType: event.target.value })}
      >
        <option value="">All ticket types</option>
        {overview.ticketBreakdown.map((ticketType) => (
          <option key={ticketType.name} value={ticketType.name}>
            {ticketType.name}
          </option>
        ))}
      </select>
      {includeCheckIn ? (
        <select
          value={checkedIn}
          aria-label="Filter by check-in"
          className="bg-background h-11 rounded-lg border px-3 text-sm"
          onChange={(event) => onChange({ checkedIn: event.target.value })}
        >
          <option value="">All check-ins</option>
          <option value="true">Checked in</option>
          <option value="false">Not checked in</option>
        </select>
      ) : null}
      <Button type="submit" className="h-11">
        Search
      </Button>
    </form>
  );
}

function AttendeesTab({ overview }: { overview: ManagementOverview }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "";
  const ticketType = params.get("ticketType") ?? "";
  const filters: ManagementListQuery = {
    page,
    search: search || undefined,
    status: (status || undefined) as ManagementListQuery["status"],
    ticketType: ticketType || undefined,
  };
  const request = useQuery({
    queryKey: queryKeys.management.attendees(overview.event._id, filters),
    queryFn: () => getManagementAttendees(overview.event._id, filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const data = request.data;
  const error = request.isError
    ? getEventErrorMessage(request.error)
    : undefined;

  const update = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    next.set("page", "1");
    Object.entries(values).forEach(([name, value]) =>
      value ? next.set(name, value) : next.delete(name),
    );
    setParams(next);
  };

  return (
    <>
      <Filters
        overview={overview}
        search={search}
        status={status}
        ticketType={ticketType}
        statusOptions={[
          { value: "confirmed", label: "Confirmed" },
          { value: "pending", label: "Pending" },
          { value: "cancelled", label: "Cancelled" },
          { value: "refunded", label: "Refunded" },
        ]}
        onChange={update}
      />
      {!data && !error ? (
        <LoadingRows />
      ) : error ? (
        <ListError message={error} />
      ) : data?.attendees.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-220 text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.attendees.map((item) => (
                <tr key={item.registrationId}>
                  <td className="px-4 py-4">
                    <p className="font-medium">{item.attendee.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.attendee.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">{item.ticketType}</td>
                  <td className="px-4 py-4">{item.quantity}</td>
                  <td className="px-4 py-4">
                    {dateFormatter.format(new Date(item.registeredAt))}
                  </td>
                  <td className="px-4 py-4 capitalize">{item.status}</td>
                  <td className="px-4 py-4">
                    {item.checkedInCount} / {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground border-y py-16 text-center">
          No attendees found.
        </div>
      )}
      {data && (
        <Pagination
          pagination={data.pagination}
          onPage={(value) => update({ page: String(value) })}
        />
      )}
    </>
  );
}

function TicketsTab({ overview }: { overview: ManagementOverview }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "";
  const ticketType = params.get("ticketType") ?? "";
  const checkedIn = params.get("checkedIn") ?? "";
  const filters: ManagementListQuery = {
    page,
    search: search || undefined,
    status: (status || undefined) as ManagementListQuery["status"],
    ticketType: ticketType || undefined,
    checkedIn: checkedIn ? checkedIn === "true" : undefined,
  };
  const request = useQuery({
    queryKey: queryKeys.management.tickets(overview.event._id, filters),
    queryFn: () => getManagementTickets(overview.event._id, filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const data = request.data;
  const error = request.isError
    ? getEventErrorMessage(request.error)
    : undefined;

  const update = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    next.set("page", "1");
    Object.entries(values).forEach(([name, value]) =>
      value ? next.set(name, value) : next.delete(name),
    );
    setParams(next);
  };

  return (
    <>
      <Filters
        overview={overview}
        search={search}
        status={status}
        ticketType={ticketType}
        checkedIn={checkedIn}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "used", label: "Used" },
          { value: "cancelled", label: "Cancelled" },
          { value: "expired", label: "Expired" },
        ]}
        includeCheckIn
        onChange={update}
      />
      {!data && !error ? (
        <LoadingRows />
      ) : error ? (
        <ListError message={error} />
      ) : data?.tickets.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Ticket code</th>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.tickets.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-4 font-mono text-xs">
                    {item.ticketCode}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{item.user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">{item.ticketType}</td>
                  <td className="px-4 py-4 capitalize">{item.status}</td>
                  <td className="px-4 py-4">
                    {item.checkedIn ? "Checked in" : "Not checked in"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground border-y py-16 text-center">
          No tickets found.
        </div>
      )}
      {data && (
        <Pagination
          pagination={data.pagination}
          onPage={(value) => update({ page: String(value) })}
        />
      )}
    </>
  );
}

function CheckInsTab({ overview }: { overview: ManagementOverview }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") ?? "";
  const ticketType = params.get("ticketType") ?? "";
  const filters: ManagementListQuery = {
    page,
    search: search || undefined,
    ticketType: ticketType || undefined,
  };
  const request = useQuery({
    queryKey: queryKeys.management.checkIns(overview.event._id, filters),
    queryFn: () => getManagementCheckIns(overview.event._id, filters),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
  const data = request.data;
  const error = request.isError
    ? getEventErrorMessage(request.error)
    : undefined;

  const update = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    next.set("page", "1");
    Object.entries(values).forEach(([name, value]) =>
      value ? next.set(name, value) : next.delete(name),
    );
    setParams(next);
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Filters
          overview={overview}
          search={search}
          status=""
          ticketType={ticketType}
          statusOptions={[]}
          onChange={update}
        />
        <Link
          to={`/organizer/events/${overview.event._id}/check-in`}
          className={cn(buttonVariants(), "h-11 px-4")}
        >
          <ScanLine className="size-4" /> Open scanner
        </Link>
      </div>
      {!data && !error ? (
        <LoadingRows />
      ) : error ? (
        <ListError message={error} />
      ) : data?.checkIns.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Ticket code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Check-in time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.checkIns.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-4">
                    <p className="font-medium">{item.user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {item.ticketCode}
                  </td>
                  <td className="px-4 py-4">{item.ticketType}</td>
                  <td className="px-4 py-4">
                    {item.checkedInAt
                      ? dateFormatter.format(new Date(item.checkedInAt))
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground border-y py-16 text-center">
          No check-ins yet.
        </div>
      )}
      {data && (
        <Pagination
          pagination={data.pagination}
          onPage={(value) => update({ page: String(value) })}
        />
      )}
    </>
  );
}

function OverviewTab({ overview }: { overview: ManagementOverview }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${overview.event.venue.name} ${overview.event.venue.address}`,
  )}`;
  const metrics: Array<[string, string | number, LucideIcon]> = [
    ["Capacity", overview.metrics.capacity, UsersRound],
    ["Registrations", overview.metrics.totalRegistrations, CalendarDays],
    ["Tickets issued", overview.metrics.ticketsIssued, Ticket],
    ["Checked in", overview.metrics.checkedInAttendees, UserRoundCheck],
    ["Remaining", overview.metrics.remainingCapacity, CheckCircle2],
    ["Revenue", formatKyat(overview.metrics.revenue), CircleDollarSign],
  ];
  const visibleMetrics = metrics.filter(
    ([label]) =>
      label !== "Revenue" ||
      overview.ticketBreakdown.some((ticket) => ticket.price > 0),
  );
  return (
    <div className="space-y-8">
      <div className="bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3">
        {visibleMetrics.map(([label, value, Icon]) => (
          <div key={label} className="bg-card p-5">
            <Icon className="text-primary size-5" />
            <p className="text-muted-foreground mt-4 text-sm">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {typeof value === "number"
                ? numberFormatter.format(value)
                : value}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 border-y py-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-sm">Schedule</p>
          <p className="mt-1 font-medium">
            {dateFormatter.format(new Date(overview.event.startDate))}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Venue</p>
          <p className="mt-1 font-medium">{overview.event.venue.name}</p>
          <p className="text-muted-foreground text-sm">
            {overview.event.venue.address}
          </p>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            View on Map <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Category</p>
          <p className="mt-1 font-medium">{overview.event.category}</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ overview }: { overview: ManagementOverview }) {
  const request = useQuery({
    queryKey: queryKeys.management.analytics(overview.event._id),
    queryFn: () => getManagementAnalytics(overview.event._id),
    staleTime: 45_000,
  });
  const data = request.data;
  const error = request.isError
    ? getEventErrorMessage(request.error)
    : undefined;

  if (!data && !error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="bg-muted h-28 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!data)
    return <ListError message={error ?? "Analytics could not be loaded."} />;

  const summary = [
    [
      "Total registrations",
      numberFormatter.format(data.summary.totalRegistrations),
    ],
    ["Capacity used", `${data.summary.capacityUsedPercent}%`],
    ["Tickets issued", numberFormatter.format(data.summary.ticketsIssued)],
    ["Total check-ins", numberFormatter.format(data.summary.totalCheckIns)],
    ["Check-in rate", `${data.summary.checkInRatePercent}%`],
    ["Revenue", formatKyat(data.summary.revenue)],
  ];
  const hasTicketDistribution = data.ticketTypes.some((item) => item.value > 0);
  const hasCheckIns = data.checkIns.some((item) => item.value > 0);
  const chartTooltip = {
    backgroundColor: "var(--card)",
    borderColor: "var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
  };
  const pieColors = ["#10b981", "#f59e0b"];

  return (
    <div className="space-y-8">
      <div className="bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3">
        {summary.map(([label, value]) => (
          <div key={label} className="bg-card p-5">
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="min-w-0 border-y py-6 xl:col-span-2">
          <h3 className="font-semibold">Registrations over time</h3>
          {data.registrationsOverTime.length ? (
            <div className="mt-5 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.registrationsOverTime}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) =>
                      new Intl.DateTimeFormat(undefined, {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(`${value}T00:00:00`))
                    }
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={chartTooltip} />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="var(--primary)"
                    fill="var(--accent)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground grid h-56 place-items-center text-sm">
              No registration data yet.
            </p>
          )}
        </section>

        <section className="min-w-0 border-b pb-6">
          <h3 className="font-semibold">Ticket types distribution</h3>
          {hasTicketDistribution ? (
            <div className="mt-5 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ticketTypes} layout="vertical">
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={chartTooltip} />
                  <Bar
                    dataKey="value"
                    name="Tickets"
                    fill="var(--primary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground grid h-56 place-items-center text-sm">
              No issued tickets yet.
            </p>
          )}
        </section>

        <section className="min-w-0 border-b pb-6">
          <h3 className="font-semibold">Check-ins vs not checked in</h3>
          {hasCheckIns ? (
            <div className="mt-5 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.checkIns}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {data.checkIns.map((item, index) => (
                      <Cell key={item.name} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground grid h-56 place-items-center text-sm">
              No check-in data yet.
            </p>
          )}
          {hasCheckIns && (
            <div className="flex justify-center gap-5 text-sm">
              {data.checkIns.map((item, index) => (
                <span key={item.name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ backgroundColor: pieColors[index] }}
                  />
                  {item.name}: {numberFormatter.format(item.value)}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <dl className="bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
        <div className="bg-card p-5">
          <dt className="text-muted-foreground text-sm">
            Cancelled registrations
          </dt>
          <dd className="mt-2 text-xl font-semibold">
            {numberFormatter.format(data.statistics.cancelledRegistrations)}
          </dd>
        </div>
        <div className="bg-card p-5">
          <dt className="text-muted-foreground text-sm">
            Average tickets per registration
          </dt>
          <dd className="mt-2 text-xl font-semibold">
            {data.statistics.averageTicketsPerRegistration}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function SettingsTab({
  overview,
  onEventUpdated,
}: {
  overview: ManagementOverview;
  onEventUpdated(event: Event): void;
}) {
  const queryClient = useQueryClient();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [venueName, setVenueName] = useState(overview.event.venue.name);
  const [venueAddress, setVenueAddress] = useState(
    overview.event.venue.address,
  );
  const [venueError, setVenueError] = useState("");
  const [details, setDetails] = useState(() => ({
    title: overview.event.title,
    category: overview.event.category,
    description: overview.event.description,
    startDate: dateTimeInputValue(overview.event.startDate),
    endDate: dateTimeInputValue(overview.event.endDate),
    capacity: overview.event.capacity,
    ticketTypes: overview.event.ticketTypes.map((ticket) => ({ ...ticket })),
  }));
  const [detailsError, setDetailsError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [bannerFile, setBannerFile] = useState<File>();
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerError, setBannerError] = useState("");
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${overview.event.venue.name} ${overview.event.venue.address}`,
  )}`;

  useEffect(
    () => () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    },
    [bannerPreview],
  );

  const refreshEventData = async (event: Event) => {
    onEventUpdated(event);
    await Promise.all([
      invalidateEventManagementData(queryClient, overview.event._id),
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizers.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(event.slug),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizerEvents.all,
      }),
    ]);
  };
  const bannerMutation = useMutation({
    mutationFn: (file: File) => replaceEventBanner(overview.event._id, file),
    onSuccess: async (event) => {
      await refreshEventData(event);
      setBannerFile(undefined);
      setBannerPreview("");
      toast.success("Banner updated");
    },
  });
  const removeBannerMutation = useMutation({
    mutationFn: () => removeEventBanner(overview.event._id),
    onSuccess: async (event) => {
      await refreshEventData(event);
      setBannerFile(undefined);
      setBannerPreview("");
      toast.success("Banner removed");
    },
  });
  const venueMutation = useMutation({
    mutationFn: (venue: { name: string; address: string }) =>
      updateEventVenue(overview.event._id, venue),
    onSuccess: async (event) => {
      await refreshEventData(event);
      toast.success("Venue updated");
    },
  });
  const detailsMutation = useMutation({
    mutationFn: () =>
      updateEventDetails(overview.event._id, {
        title: details.title.trim(),
        category: details.category.trim(),
        description: details.description.trim(),
        startDate: new Date(details.startDate).toISOString(),
        endDate: new Date(details.endDate).toISOString(),
        capacity: details.capacity,
        ticketTypes: details.ticketTypes.map(({ name, price, quantity }) => ({
          name: name.trim(),
          price,
          quantity,
        })),
      }),
    onSuccess: async (event) => {
      await refreshEventData(event);
      toast.success("Event details updated");
    },
  });
  const publishMutation = useMutation({
    mutationFn: () => updateEventStatus(overview.event._id, "published"),
    onSuccess: async (event) => {
      await refreshEventData(event);
      toast.success("Event published");
    },
  });

  const chooseBanner = (file?: File) => {
    setBannerError("");
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setBannerError("Choose an image no larger than 8 MB.");
      return;
    }
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const clearBannerSelection = () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(undefined);
    setBannerPreview("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const saveBanner = async () => {
    if (!bannerFile) return;
    setBannerError("");
    try {
      await bannerMutation.mutateAsync(bannerFile);
    } catch (error) {
      setBannerError(
        getEventErrorMessage(error, "Banner could not be updated."),
      );
    }
  };

  const deleteBanner = async () => {
    if (!window.confirm("Remove this event banner?")) return;
    setBannerError("");
    try {
      await removeBannerMutation.mutateAsync();
    } catch (error) {
      setBannerError(
        getEventErrorMessage(error, "Banner could not be removed."),
      );
    }
  };

  const saveVenue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = venueName.trim();
    const address = venueAddress.trim();
    if (name.length < 2)
      return setVenueError("Venue name must be at least 2 characters.");
    if (address.length < 5)
      return setVenueError("Address must be at least 5 characters.");

    setVenueError("");
    try {
      await venueMutation.mutateAsync({ name, address });
    } catch (error) {
      setVenueError(getEventErrorMessage(error, "Venue could not be updated."));
    }
  };

  const publishEvent = async () => {
    setStatusError("");
    try {
      await publishMutation.mutateAsync();
    } catch (error) {
      setStatusError(
        getEventErrorMessage(error, "Event could not be published."),
      );
    }
  };

  const saveDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startDate = new Date(details.startDate);
    const endDate = new Date(details.endDate);
    const totalTickets = details.ticketTypes.reduce(
      (total, ticket) => total + ticket.quantity,
      0,
    );

    if (details.title.trim().length < 3)
      return setDetailsError("Title must be at least 3 characters.");
    if (details.category.trim().length < 2)
      return setDetailsError("Category must be at least 2 characters.");
    if (details.description.trim().length < 20)
      return setDetailsError("Description must be at least 20 characters.");
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      return setDetailsError("End date must be after the start date.");
    }
    if (
      !Number.isInteger(details.capacity) ||
      details.capacity < overview.event.registeredCount
    ) {
      return setDetailsError(
        `Capacity must be a whole number of at least ${Math.max(1, overview.event.registeredCount)}.`,
      );
    }
    if (!details.ticketTypes.length)
      return setDetailsError("Add at least one ticket type.");
    if (
      details.ticketTypes.some(
        (ticket) =>
          !ticket.name.trim() ||
          ticket.price < 0 ||
          !Number.isFinite(ticket.price) ||
          !Number.isInteger(ticket.quantity) ||
          ticket.quantity < ticket.sold,
      )
    ) {
      return setDetailsError(
        "Ticket names, prices, and quantities must be valid. Quantity cannot be lower than tickets sold.",
      );
    }
    if (totalTickets > details.capacity)
      return setDetailsError(
        "Total ticket quantity cannot exceed event capacity.",
      );
    const names = details.ticketTypes.map((ticket) =>
      ticket.name.trim().toLowerCase(),
    );
    if (new Set(names).size !== names.length)
      return setDetailsError("Ticket type names must be unique.");

    setDetailsError("");
    try {
      await detailsMutation.mutateAsync();
    } catch (error) {
      setDetailsError(
        getEventErrorMessage(error, "Event details could not be updated."),
      );
    }
  };

  const isSavingBanner =
    bannerMutation.isPending || removeBannerMutation.isPending;
  const isSavingVenue = venueMutation.isPending;
  const isSavingDetails = detailsMutation.isPending;
  const isPublishing = publishMutation.isPending;

  const discardChanges = () => {
    setDetails({
      title: overview.event.title,
      category: overview.event.category,
      description: overview.event.description,
      startDate: dateTimeInputValue(overview.event.startDate),
      endDate: dateTimeInputValue(overview.event.endDate),
      capacity: overview.event.capacity,
      ticketTypes: overview.event.ticketTypes.map((ticket) => ({ ...ticket })),
    });
    setVenueName(overview.event.venue.name);
    setVenueAddress(overview.event.venue.address);
    setDetailsError("");
    setVenueError("");
    setBannerError("");
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(undefined);
    setBannerPreview("");
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0 space-y-5">
        <section
          id="edit-details"
          className="border-border/70 bg-card/70 scroll-mt-24 rounded-lg border p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="bg-primary/15 text-primary grid size-9 shrink-0 place-items-center rounded-md">
              <Info className="size-4.5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Basic information</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Update the information attendees see on the event page.
              </p>
            </div>
          </div>
          <form
            id="event-details-form"
            className="mt-6 space-y-6"
            onSubmit={saveDetails}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="manage-title"
                  className="mb-2 block text-sm font-medium"
                >
                  Event title
                </label>
                <Input
                  id="manage-title"
                  value={details.title}
                  maxLength={160}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="manage-category"
                  className="mb-2 block text-sm font-medium"
                >
                  Category
                </label>
                <Input
                  id="manage-category"
                  value={details.category}
                  maxLength={80}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="manage-description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="manage-description"
                value={details.description}
                maxLength={5000}
                rows={6}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/20 w-full resize-y rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-3 focus-visible:outline-none"
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="manage-start-date"
                  className="mb-2 block text-sm font-medium"
                >
                  Start date and time
                </label>
                <Input
                  id="manage-start-date"
                  type="datetime-local"
                  value={details.startDate}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="manage-end-date"
                  className="mb-2 block text-sm font-medium"
                >
                  End date and time
                </label>
                <Input
                  id="manage-end-date"
                  type="datetime-local"
                  value={details.endDate}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="manage-capacity"
                  className="mb-2 block text-sm font-medium"
                >
                  Capacity
                </label>
                <Input
                  id="manage-capacity"
                  type="number"
                  min={Math.max(1, overview.event.registeredCount)}
                  step="1"
                  value={details.capacity}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      capacity: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div id="edit-tickets" className="scroll-mt-24 border-t pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium">Ticket types</h4>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Ticket types with sales cannot be renamed or removed.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDetails((current) => ({
                      ...current,
                      ticketTypes: [
                        ...current.ticketTypes,
                        { name: "", price: 0, quantity: 1, sold: 0 },
                      ],
                    }))
                  }
                >
                  <Plus className="size-4" /> Add ticket
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {details.ticketTypes.map((ticket, index) => (
                  <div
                    key={`${index}-${ticket.sold}`}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] sm:items-end"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Name
                      </label>
                      <Input
                        value={ticket.name}
                        maxLength={80}
                        disabled={ticket.sold > 0}
                        onChange={(event) =>
                          setDetails((current) => ({
                            ...current,
                            ticketTypes: current.ticketTypes.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, name: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Price (Ks)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ticket.price}
                        onChange={(event) =>
                          setDetails((current) => ({
                            ...current,
                            ticketTypes: current.ticketTypes.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      price: Number(event.target.value),
                                    }
                                  : item,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min={ticket.sold}
                        step="1"
                        value={ticket.quantity}
                        onChange={(event) =>
                          setDetails((current) => ({
                            ...current,
                            ticketTypes: current.ticketTypes.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      quantity: Number(event.target.value),
                                    }
                                  : item,
                            ),
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={
                        ticket.sold > 0 || details.ticketTypes.length === 1
                      }
                      aria-label={`Remove ${ticket.name || "ticket type"}`}
                      title={
                        ticket.sold > 0
                          ? "Sold ticket types cannot be removed"
                          : "Remove ticket type"
                      }
                      onClick={() =>
                        setDetails((current) => ({
                          ...current,
                          ticketTypes: current.ticketTypes.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {detailsError && (
              <p className="text-destructive text-sm" role="alert">
                {detailsError}
              </p>
            )}
          </form>
        </section>
        <section
          id="edit-media"
          className="border-border/70 bg-card/70 scroll-mt-24 rounded-lg border p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="bg-primary/15 text-primary grid size-9 place-items-center rounded-md">
              <ImageIcon className="size-4.5" />
            </span>
            <h3 className="text-lg font-semibold">Event media</h3>
          </div>
          <div className="group bg-muted relative mt-4 aspect-[16/7] overflow-hidden rounded-lg border">
            {bannerPreview || overview.event.banner ? (
              <img
                src={bannerPreview || overview.event.banner || undefined}
                alt="Event banner preview"
                className="size-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground grid size-full place-items-center text-center">
                <div>
                  <ImageOff className="mx-auto size-8" />
                  <p className="mt-2 text-sm">Click to upload a banner</p>
                </div>
              </div>
            )}
            <button
              type="button"
              className="focus-visible:ring-ring absolute inset-0 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
              aria-label="Choose banner image"
              disabled={isSavingBanner}
              onClick={() => bannerInputRef.current?.click()}
            />
            {(bannerPreview || overview.event.banner) && (
              <button
                type="button"
                className="bg-destructive text-destructive-foreground absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                aria-label={
                  bannerFile ? "Clear selected banner" : "Remove banner"
                }
                disabled={isSavingBanner}
                onClick={bannerFile ? clearBannerSelection : deleteBanner}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <Input
            ref={bannerInputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={(event) => chooseBanner(event.target.files?.[0])}
          />
          {bannerError && (
            <p className="text-destructive mt-2 text-sm" role="alert">
              {bannerError}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!bannerFile || isSavingBanner}
              onClick={saveBanner}
            >
              {isSavingBanner ? "Uploading" : "Save banner"}
            </Button>
          </div>
        </section>
        <section
          id="edit-venue"
          className="border-border/70 bg-card/70 scroll-mt-24 rounded-lg border p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="bg-primary/15 text-primary grid size-9 place-items-center rounded-md">
              <MapPin className="size-4.5" />
            </span>
            <h3 className="text-lg font-semibold">Venue details</h3>
          </div>
          <form className="mt-4 space-y-4" onSubmit={saveVenue}>
            <div>
              <label
                htmlFor="manage-venue-name"
                className="mb-2 block text-sm font-medium"
              >
                Venue name
              </label>
              <Input
                id="manage-venue-name"
                value={venueName}
                maxLength={160}
                onChange={(event) => setVenueName(event.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="manage-venue-address"
                className="mb-2 block text-sm font-medium"
              >
                Address
              </label>
              <Input
                id="manage-venue-address"
                value={venueAddress}
                maxLength={300}
                onChange={(event) => setVenueAddress(event.target.value)}
              />
            </div>
            {venueError && (
              <p className="text-destructive text-sm" role="alert">
                {venueError}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                className="h-10 px-4"
                disabled={isSavingVenue}
              >
                {isSavingVenue ? "Saving" : "Save venue"}
              </Button>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 px-4",
                )}
              >
                <ExternalLink className="size-4" /> View on Map
              </a>
            </div>
          </form>
        </section>
      </div>

      <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
        <section
          id="edit-status"
          className="border-border/70 bg-card/70 order-2 scroll-mt-24 rounded-lg border p-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-emerald-500/15 text-emerald-400">
              <span className="size-3 rounded-full bg-emerald-400" />
            </span>
            <h3 className="text-lg font-semibold">Event status</h3>
          </div>
          <dl className="mt-4 divide-y border-y">
            <div className="flex justify-between py-4">
              <dt className="text-muted-foreground">Current status</dt>
              <dd className="font-semibold capitalize">
                {overview.event.status}
              </dd>
            </div>
            <div className="flex justify-between py-4">
              <dt className="text-muted-foreground">Visibility</dt>
              <dd className="font-semibold">
                {overview.event.status === "published"
                  ? "Public"
                  : "Not public"}
              </dd>
            </div>
          </dl>
          {(overview.event.status === "draft" ||
            overview.event.status === "pending") && (
            <div className="mt-4">
              <Button onClick={publishEvent} disabled={isPublishing}>
                {isPublishing ? "Publishing" : "Publish event"}
              </Button>
              {statusError && (
                <p className="text-destructive mt-2 text-sm" role="alert">
                  {statusError}
                </p>
              )}
            </div>
          )}
        </section>
        <section className="border-border/70 bg-card/70 order-1 rounded-lg border p-5">
          <div className="flex items-center gap-3">
            <span className="bg-primary/15 text-primary grid size-9 place-items-center rounded-md">
              <Rocket className="size-4.5" />
            </span>
            <h3 className="text-lg font-semibold">Event tools</h3>
          </div>
          <div className="mt-4 grid gap-3">
            {overview.event.status === "published" && (
              <Link
                to={`/events/${overview.event.slug}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 px-4",
                )}
              >
                <Eye className="size-4" /> View event page
              </Link>
            )}
            <Link
              to={`/organizer/events/${overview.event._id}/check-in`}
              className={cn(buttonVariants(), "h-11 px-4")}
            >
              <ScanLine className="size-4" /> Open ticket scanner
            </Link>
          </div>
        </section>
        <section className="border-border/70 bg-card/70 order-3 rounded-lg border p-5">
          <div className="flex items-center gap-3">
            <span className="bg-primary/15 text-primary grid size-9 place-items-center rounded-md">
              <Lightbulb className="size-4.5" />
            </span>
            <h3 className="text-lg font-semibold">Quick tips</h3>
          </div>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            {[
              "Use a clear event title",
              "Add a high-quality banner",
              "Keep date and venue details accurate",
              "Check ticket pricing and quantity",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
        <div className="border-border/70 bg-card/70 order-4 grid gap-2 rounded-lg border p-4">
          <Button
            type="submit"
            form="event-details-form"
            disabled={isSavingDetails}
          >
            <Save className="size-4" />
            {isSavingDetails ? "Saving changes" : "Save event details"}
          </Button>
          <Button type="button" variant="outline" onClick={discardChanges}>
            <RotateCcw className="size-4" /> Discard changes
          </Button>
        </div>
      </aside>
    </div>
  );
}

export function EventManagementPage() {
  const { eventId = "" } = useParams();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const requestedTab = params.get("tab") as ManagementTab | null;
  const activeTab =
    requestedTab && tabs.includes(requestedTab) ? requestedTab : "overview";
  const overviewQuery = useQuery({
    queryKey: queryKeys.management.overview(eventId),
    queryFn: () => getManagementOverview(eventId),
    enabled: Boolean(eventId),
    staleTime: 30_000,
  });
  const overview = overviewQuery.data;
  const error = overviewQuery.isError
    ? getEventErrorMessage(
        overviewQuery.error,
        "Event management data could not be loaded.",
      )
    : undefined;

  if (!overview && !error)
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-muted h-10 w-2/3 animate-pulse rounded" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="bg-muted h-32 animate-pulse rounded" />
          ))}
        </div>
      </main>
    );
  if (!overview)
    return (
      <main className="mx-auto grid min-h-[62dvh] max-w-5xl place-items-center px-4 text-center">
        <div>
          <AlertCircle className="text-destructive mx-auto size-10" />
          <h1 className="mt-4 text-3xl font-semibold">
            Management unavailable
          </h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </main>
    );

  const handleEventUpdated = (event: Event) => {
    queryClient.setQueryData<ManagementOverview>(
      queryKeys.management.overview(eventId),
      (current) =>
        current
          ? { ...current, event: { ...current.event, ...event } }
          : current,
    );
  };

  if (activeTab === "settings") {
    return (
      <main className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <ManagementSidebar eventId={eventId} activeTab={activeTab} />
          <div className="min-w-0">
            <div className="mb-7 border-b pb-6">
              <p className="text-primary text-sm font-semibold">
                Event workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                Edit event
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Update {overview.event.title} and manage its ticket settings.
              </p>
            </div>
            <SettingsTab
              key={overview.event._id}
              overview={overview}
              onEventUpdated={handleEventUpdated}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <ManagementSidebar eventId={eventId} activeTab={activeTab} />
        <div className="min-w-0">
          <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-primary text-sm font-semibold">
                  Event management
                </span>
                <span className="bg-secondary rounded-md px-2 py-1 text-xs font-semibold capitalize">
                  {overview.event.status}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                {overview.event.title}
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                <MapPin className="size-4" /> {overview.event.venue.name}
              </p>
            </div>
            <Link
              to={`/organizer/events/${eventId}/check-in`}
              className={cn(buttonVariants(), "h-11 px-4")}
            >
              <ScanLine className="size-4" /> Check in tickets
            </Link>
          </div>

          <section className="py-8" aria-labelledby="active-management-tab">
            <h2
              id="active-management-tab"
              className="mb-6 text-2xl font-semibold"
            >
              {title(activeTab)}
            </h2>
            {activeTab === "overview" && <OverviewTab overview={overview} />}
            {activeTab === "attendees" && <AttendeesTab overview={overview} />}
            {activeTab === "tickets" && <TicketsTab overview={overview} />}
            {activeTab === "check-ins" && <CheckInsTab overview={overview} />}
            {activeTab === "analytics" && <AnalyticsTab overview={overview} />}
          </section>
        </div>
      </div>
    </main>
  );
}
