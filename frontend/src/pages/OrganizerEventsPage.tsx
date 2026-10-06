import { useState, type FormEvent } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  ImageOff,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  deleteOrganizerEvent,
  getEventErrorMessage,
  getOrganizerEvents,
  type OrganizerEventQuery,
} from "@/services/events";
import type { EventStatus } from "@/types/events";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const statuses: Array<{ label: string; value: "" | EventStatus }> = [
  { label: "All statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Published", value: "published" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function OrganizerEventsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState<OrganizerEventQuery>({ page: 1 });
  const eventsQuery = useQuery({
    queryKey: [...queryKeys.organizerEvents.all, query],
    queryFn: () => getOrganizerEvents(query),
    placeholderData: keepPreviousData,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOrganizerEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizerEvents.all,
      });
      toast.success("Draft event deleted");
    },
    onError: (error) =>
      toast.error(
        getEventErrorMessage(error, "Draft event could not be deleted."),
      ),
  });

  const search = (event: FormEvent) => {
    event.preventDefault();
    setQuery((current) => ({
      ...current,
      page: 1,
      search: searchInput.trim() || undefined,
    }));
  };

  const removeDraft = (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Delete draft "${eventTitle}"? This cannot be undone.`))
      return;
    deleteMutation.mutate(eventId);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Organizer</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            My events
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Edit event details, publish drafts, and manage attendees.
          </p>
        </div>
        <Link to="/events/create" className={cn(buttonVariants(), "h-11 px-4")}>
          <Plus className="size-4" /> Create event
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <form className="flex gap-2" onSubmit={search}>
          <Input
            value={searchInput}
            placeholder="Search your events"
            aria-label="Search your events"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
        <select
          value={query.status ?? ""}
          aria-label="Filter events by status"
          className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
          onChange={(event) =>
            setQuery((current) => ({
              ...current,
              page: 1,
              status: (event.target.value || undefined) as
                EventStatus | undefined,
            }))
          }
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {eventsQuery.isPending ? (
        <div className="mt-8 space-y-4" aria-label="Loading organizer events">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="bg-muted h-48 animate-pulse rounded-lg motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : eventsQuery.isError ? (
        <div className="mt-10 rounded-lg border py-14 text-center">
          <AlertCircle className="text-destructive mx-auto size-9" />
          <p className="text-muted-foreground mt-4">
            {getEventErrorMessage(
              eventsQuery.error,
              "Your events could not be loaded.",
            )}
          </p>
          <Button className="mt-5" onClick={() => void eventsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : eventsQuery.data.events.length ? (
        <div className="mt-8 space-y-4">
          {eventsQuery.data.events.map((event) => (
            <article
              key={event._id}
              className="bg-card overflow-hidden rounded-lg border sm:grid sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <div className="bg-muted aspect-video sm:aspect-auto sm:min-h-52">
                {event.banner ? (
                  <img
                    src={event.banner}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground grid size-full place-items-center">
                    <ImageOff className="size-8" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-accent text-accent-foreground rounded-md px-2 py-1 text-xs font-semibold">
                        {event.category}
                      </span>
                      <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs font-semibold capitalize">
                        {event.status}
                      </span>
                    </div>
                    <h2 className="mt-3 truncate text-xl font-semibold">
                      {event.title}
                    </h2>
                  </div>
                </div>
                <div className="text-muted-foreground mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0" />
                    {dateFormatter.format(new Date(event.startDate))}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">{event.venue.name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <UsersRound className="size-4 shrink-0" />
                    {event.registeredCount} / {event.capacity} registered
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link
                    to={`/organizer/events/${event._id}/manage?tab=settings`}
                    className={cn(buttonVariants(), "h-10 px-4")}
                  >
                    <Pencil className="size-4" /> Edit event
                  </Link>
                  <Link
                    to={`/organizer/events/${event._id}/manage`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-10 px-4",
                    )}
                  >
                    Manage
                  </Link>
                  {event.status === "published" && (
                    <Link
                      to={`/events/${event.slug}`}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-10 px-4",
                      )}
                    >
                      View event
                    </Link>
                  )}
                  {event.status === "draft" && (
                    <Button
                      variant="destructive"
                      className="h-10 px-4"
                      disabled={deleteMutation.isPending}
                      onClick={() => removeDraft(event._id, event.title)}
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === event._id ? (
                        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      {deleteMutation.isPending &&
                      deleteMutation.variables === event._id
                        ? "Deleting"
                        : "Delete draft"}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {eventsQuery.data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                disabled={query.page <= 1}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {query.page} of {eventsQuery.data.pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={query.page >= eventsQuery.data.pagination.pages}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed py-14 text-center">
          <CalendarDays className="text-muted-foreground mx-auto size-9" />
          <h2 className="mt-4 text-xl font-semibold">No events found</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Create an event or adjust your search and status filter.
          </p>
        </div>
      )}
    </main>
  );
}
