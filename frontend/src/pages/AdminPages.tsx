import { useState, type FormEvent } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Search,
  Tags,
  Ticket,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  cancelAdminEvent,
  getAdminCategories,
  getAdminDashboard,
  getAdminError,
  getAdminEvents,
  getAdminUser,
  getAdminUsers,
  setAdminUserStatus,
} from "@/services/admin";
import type { UserRole } from "@/types/auth";
import type { AdminEvent, AdminPagination, AdminUser } from "@/types/admin";
import type { EventStatus } from "@/types/events";

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const number = new Intl.NumberFormat();
const selectClass =
  "border-input bg-background h-10 rounded-lg border px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20";

function Loading() {
  return (
    <div className="grid min-h-72 place-items-center" role="status">
      <LoaderCircle className="text-primary size-6 animate-spin" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry(): void }) {
  return (
    <div className="grid min-h-72 place-items-center text-center">
      <div>
        <AlertCircle className="text-destructive mx-auto size-9" />
        <p className="text-muted-foreground mt-3">{message}</p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function Pagination({
  value,
  onPage,
}: {
  value: AdminPagination;
  onPage(page: number): void;
}) {
  if (value.pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between border-t pt-5 text-sm">
      <span className="text-muted-foreground">
        Page {value.page} of {value.pages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={value.page <= 1}
          onClick={() => onPage(value.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={value.page >= value.pages}
          onClick={() => onPage(value.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: getAdminDashboard,
    staleTime: 30_000,
  });
  if (dashboardQuery.isPending) return <Loading />;
  if (dashboardQuery.isError)
    return (
      <ErrorState
        message={getAdminError(
          dashboardQuery.error,
          "Dashboard could not be loaded.",
        )}
        retry={() => void dashboardQuery.refetch()}
      />
    );
  const data = dashboardQuery.data;
  const cards = [
    ["Total users", data.summary.totalUsers, UsersRound],
    ["Organizers", data.summary.totalOrganizers, UserRound],
    ["Attendees", data.summary.totalAttendees, UserRound],
    ["Events", data.summary.totalEvents, CalendarDays],
    ["Registrations", data.summary.totalRegistrations, CheckCircle2],
    ["Tickets", data.summary.totalTickets, Ticket],
  ] as const;
  return (
    <div className="py-8">
      <section
        className="bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Platform totals"
      >
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="bg-card p-5">
            <Icon className="text-primary size-5" />
            <p className="text-muted-foreground mt-4 text-sm">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {number.format(value)}
            </p>
          </div>
        ))}
      </section>
      <section className="mt-10">
        <div className="flex items-center gap-2 border-b pb-3">
          <Activity className="text-primary size-5" />
          <h2 className="text-xl font-semibold">Recent platform activity</h2>
        </div>
        {data.activity.length ? (
          <ul className="divide-y">
            {data.activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{item.message}</span>
                <time
                  className="text-muted-foreground text-sm"
                  dateTime={item.createdAt}
                >
                  {dateTime.format(new Date(item.createdAt))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground py-10 text-center">
            No platform activity yet.
          </p>
        )}
      </section>
    </div>
  );
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [selectedId, setSelectedId] = useState<string>();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const role = (params.get("role") || undefined) as UserRole | undefined;
  const active = params.get("active");
  const filters = {
    page,
    search: params.get("search") || undefined,
    role,
    isActive: active ? active === "true" : undefined,
  };
  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: () => getAdminUsers(filters),
    staleTime: 120_000,
    placeholderData: keepPreviousData,
  });
  const selectedQuery = useQuery({
    queryKey: queryKeys.admin.user(selectedId ?? ""),
    queryFn: () => getAdminUser(selectedId!),
    enabled: Boolean(selectedId),
    staleTime: 120_000,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAdminUserStatus(id, isActive),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.admin.user(updated._id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.usersAll,
      });
      toast.success(updated.isActive ? "User activated" : "User deactivated");
    },
    onError: (request) =>
      toast.error(getAdminError(request, "User status could not be updated.")),
  });
  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateParam("search", search.trim() || undefined);
  };
  const toggle = (user: AdminUser) => {
    if (
      !window.confirm(
        `${user.isActive ? "Deactivate" : "Activate"} ${user.name}?`,
      )
    )
      return;
    statusMutation.mutate({ id: user._id, isActive: !user.isActive });
  };
  const data = usersQuery.data;
  const selected = selectedQuery.data;
  return (
    <div className="py-8">
      <form
        className="grid gap-3 border-b pb-5 md:grid-cols-[minmax(15rem,1fr)_12rem_12rem_auto]"
        onSubmit={submit}
      >
        <div className="relative">
          <Search className="text-muted-foreground absolute top-3 left-3 size-4" />
          <Input
            className="h-10 pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
          />
        </div>
        <select
          className={selectClass}
          value={role ?? ""}
          onChange={(event) =>
            updateParam("role", event.target.value || undefined)
          }
          aria-label="Role"
        >
          <option value="">All roles</option>
          <option value="attendee">Attendee</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className={selectClass}
          value={active ?? ""}
          onChange={(event) =>
            updateParam("active", event.target.value || undefined)
          }
          aria-label="Account status"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button className="h-10 px-4" type="submit">
          Search
        </Button>
      </form>
      {usersQuery.isPending ? (
        <Loading />
      ) : usersQuery.isError ? (
        <ErrorState
          message={getAdminError(
            usersQuery.error,
            "Users could not be loaded.",
          )}
          retry={() => void usersQuery.refetch()}
        />
      ) : data && data.users.length ? (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-3 py-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-muted-foreground mt-1">{user.email}</p>
                    </td>
                    <td className="px-3 py-4 capitalize">{user.role}</td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-semibold",
                          user.isActive
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {dateTime.format(new Date(user.createdAt))}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedId(user._id)}
                        >
                          View
                        </Button>
                        <Button
                          variant={user.isActive ? "destructive" : "outline"}
                          disabled={statusMutation.isPending}
                          onClick={() => toggle(user)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            value={data.pagination}
            onPage={(next) => updateParam("page", String(next))}
          />
        </>
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          No users match these filters.
        </p>
      )}
      {selectedId && selectedQuery.isPending && <Loading />}
      {selectedId && selectedQuery.isError && (
        <ErrorState
          message={getAdminError(
            selectedQuery.error,
            "User could not be loaded.",
          )}
          retry={() => void selectedQuery.refetch()}
        />
      )}
      {selected && (
        <section className="mt-8 border-y py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{selected.name}</h2>
              <p className="text-muted-foreground mt-1">{selected.email}</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedId(undefined)}>
              Close
            </Button>
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-sm">Registrations</dt>
              <dd className="mt-1 text-xl font-semibold">
                {selected.stats?.registrations ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Tickets</dt>
              <dd className="mt-1 text-xl font-semibold">
                {selected.stats?.tickets ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">
                Organized events
              </dt>
              <dd className="mt-1 text-xl font-semibold">
                {selected.stats?.organizedEvents ?? 0}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}

export function AdminEventsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = (params.get("status") || undefined) as EventStatus | undefined;
  const category = params.get("category") || undefined;
  const filters = {
    page,
    search: params.get("search") || undefined,
    status,
    category,
  };
  const eventsQuery = useQuery({
    queryKey: queryKeys.admin.events(filters),
    queryFn: () => getAdminEvents(filters),
    staleTime: 120_000,
    placeholderData: keepPreviousData,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: getAdminCategories,
    staleTime: 300_000,
  });
  const cancelMutation = useMutation({
    mutationFn: cancelAdminEvent,
    onSuccess: (updated) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.eventsAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.organizers.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detail(updated.slug),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizerEvents.all,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.management.overview(updated._id),
        }),
      ]);
      toast.success("Event cancelled");
    },
    onError: (request) =>
      toast.error(getAdminError(request, "Event could not be cancelled.")),
  });
  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  const cancel = (event: AdminEvent) => {
    if (
      !window.confirm(
        `Cancel ${event.title}? Registered attendees will be notified.`,
      )
    )
      return;
    cancelMutation.mutate(event._id);
  };
  const data = eventsQuery.data;
  const categories = categoriesQuery.data ?? [];
  return (
    <div className="py-8">
      <form
        className="grid gap-3 border-b pb-5 md:grid-cols-[minmax(15rem,1fr)_12rem_12rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          updateParam("search", search.trim() || undefined);
        }}
      >
        <div className="relative">
          <Search className="text-muted-foreground absolute top-3 left-3 size-4" />
          <Input
            className="h-10 pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search event title"
          />
        </div>
        <select
          className={selectClass}
          value={status ?? ""}
          onChange={(event) =>
            updateParam("status", event.target.value || undefined)
          }
          aria-label="Event status"
        >
          <option value="">All statuses</option>
          {["draft", "pending", "published", "completed", "cancelled"].map(
            (value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ),
          )}
        </select>
        <select
          className={selectClass}
          value={category ?? ""}
          onChange={(event) =>
            updateParam("category", event.target.value || undefined)
          }
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <Button className="h-10 px-4" type="submit">
          Search
        </Button>
      </form>
      {eventsQuery.isPending || categoriesQuery.isPending ? (
        <Loading />
      ) : eventsQuery.isError || categoriesQuery.isError ? (
        <ErrorState
          message={getAdminError(
            eventsQuery.error ?? categoriesQuery.error,
            "Events could not be loaded.",
          )}
          retry={() => {
            void eventsQuery.refetch();
            void categoriesQuery.refetch();
          }}
        />
      ) : data && data.events.length ? (
        <>
          <div className="mt-6 space-y-3">
            {data.events.map((event) => (
              <article
                key={event._id}
                className="grid gap-4 border-b py-5 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">
                      {event.title}
                    </h2>
                    <span className="bg-secondary rounded-md px-2 py-1 text-xs font-semibold capitalize">
                      {event.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {event.category} · {event.organizer.name} ·{" "}
                    {dateTime.format(new Date(event.startDate))}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {event.venue.name} · {number.format(event.registeredCount)}/
                    {number.format(event.capacity)} registered
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-8 px-3",
                    )}
                    to={`/organizer/events/${event._id}/manage`}
                  >
                    View event
                  </Link>
                  {event.status !== "cancelled" &&
                    event.status !== "completed" && (
                      <Button
                        variant="destructive"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancel(event)}
                      >
                        Cancel
                      </Button>
                    )}
                </div>
              </article>
            ))}
          </div>
          <Pagination
            value={data.pagination}
            onPage={(next) => updateParam("page", String(next))}
          />
        </>
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          No events match these filters.
        </p>
      )}
    </div>
  );
}

export function AdminCategoriesPage() {
  const categoriesQuery = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: getAdminCategories,
    staleTime: 300_000,
  });
  if (categoriesQuery.isPending) return <Loading />;
  if (categoriesQuery.isError)
    return (
      <ErrorState
        message={getAdminError(
          categoriesQuery.error,
          "Categories could not be loaded.",
        )}
        retry={() => void categoriesQuery.refetch()}
      />
    );
  const data = categoriesQuery.data;
  return (
    <div className="py-8">
      <div className="flex items-start gap-3 border-b pb-5">
        <Tags className="text-primary mt-0.5 size-5" />
        <div>
          <h2 className="text-xl font-semibold">Event categories</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Categories come from event records. No separate category collection
            is configured.
          </p>
        </div>
      </div>
      {data.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 text-right font-medium">All events</th>
                <th className="px-3 py-3 text-right font-medium">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item) => (
                <tr key={item.name}>
                  <td className="px-3 py-4 font-medium">{item.name}</td>
                  <td className="px-3 py-4 text-right">
                    {number.format(item.totalEvents)}
                  </td>
                  <td className="px-3 py-4 text-right">
                    {number.format(item.publishedEvents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          No categories yet.
        </p>
      )}
    </div>
  );
}
