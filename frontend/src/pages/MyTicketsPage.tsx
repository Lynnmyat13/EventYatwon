import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Ticket } from "lucide-react";
import { DigitalTicket } from "@/components/DigitalTicket";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import {
  dismissCancelledTicket,
  getMyTickets,
  getTicketApiError,
} from "@/services/tickets";
import type { Ticket as TicketRecord } from "@/types/tickets";
import { toast } from "sonner";

const TicketSkeleton = () => (
  <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border">
    <div className="bg-muted aspect-16/8 animate-pulse" />
    <div className="space-y-4 p-5">
      <div className="bg-muted h-7 w-3/4 animate-pulse rounded" />
      <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
      <div className="bg-muted mx-auto size-40 animate-pulse rounded" />
    </div>
  </div>
);

export function MyTicketsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.all,
    queryFn: getMyTickets,
    staleTime: 45_000,
  });
  const removeMutation = useMutation({
    mutationFn: (ticket: TicketRecord) => dismissCancelledTicket(ticket._id),
    onSuccess: (_result, ticket) => {
      queryClient.setQueryData<TicketRecord[]>(
        queryKeys.tickets.all,
        (current) => current?.filter((item) => item._id !== ticket._id) ?? [],
      );
      queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(ticket._id) });
      toast.success("Cancelled ticket removed");
    },
    onError: (error) => toast.error(getTicketApiError(error).message),
  });

  const removeTicket = (ticket: TicketRecord) => {
    if (!window.confirm("Remove this cancelled ticket from My Tickets?")) return;
    removeMutation.mutate(ticket);
  };

  if (ticketsQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-muted mb-8 h-10 w-48 animate-pulse rounded" />
        <div className="grid gap-6 lg:grid-cols-2">
          <TicketSkeleton />
          <TicketSkeleton />
        </div>
      </main>
    );
  }

  if (ticketsQuery.isError) {
    return (
      <main className="mx-auto grid min-h-[62dvh] max-w-5xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-md">
          <AlertCircle className="text-destructive mx-auto size-10" />
          <h1 className="mt-5 text-3xl font-semibold">
            Could not load tickets
          </h1>
          <p className="text-muted-foreground mt-3">
            {getTicketApiError(ticketsQuery.error).message}
          </p>
          <Button
            className="mt-6 h-10 px-4"
            onClick={() => void ticketsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const tickets = ticketsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-primary text-sm font-semibold">Attendee dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
          My tickets
        </h1>
        <p className="text-muted-foreground mt-2">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </p>
      </div>

      {tickets.length ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {tickets.map((ticket) => (
            <DigitalTicket
              key={ticket._id}
              ticket={ticket}
              attendeeName={user?.name ?? "Attendee"}
              allowDownload
              isRemoving={
                removeMutation.isPending &&
                removeMutation.variables._id === ticket._id
              }
              onRemove={
                ticket.status === "cancelled"
                  ? () => removeTicket(ticket)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-5 py-16 text-center">
          <Ticket
            className="text-muted-foreground mx-auto size-9"
            strokeWidth={1.4}
          />
          <h2 className="mt-4 text-xl font-semibold">No tickets yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your digital passes will appear here after registration.
          </p>
        </div>
      )}
    </main>
  );
}
