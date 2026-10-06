import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, LoaderCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DigitalTicket } from "@/components/DigitalTicket";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  dismissCancelledTicket,
  getTicket,
  getTicketApiError,
} from "@/services/tickets";

export function TicketDetailsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ticketQuery = useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => getTicket(id),
    enabled: Boolean(id),
    staleTime: 45_000,
  });
  const removeMutation = useMutation({
    mutationFn: () => dismissCancelledTicket(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(id) });
      toast.success("Cancelled ticket removed");
      navigate("/my-tickets", { replace: true });
    },
    onError: (error) => toast.error(getTicketApiError(error).message),
  });

  if (ticketQuery.isPending) {
    return (
      <div
        className="grid min-h-[62dvh] place-items-center"
        role="status"
        aria-label="Loading ticket"
      >
        <LoaderCircle className="text-primary size-6 animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  if (!ticketQuery.data) {
    return (
      <main className="mx-auto grid min-h-[62dvh] max-w-5xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-md">
          <AlertCircle className="text-destructive mx-auto size-10" />
          <h1 className="mt-5 text-3xl font-semibold">Ticket unavailable</h1>
          <p className="text-muted-foreground mt-3">
            {getTicketApiError(ticketQuery.error).message}
          </p>
          <Link
            to="/my-tickets"
            className={cn(buttonVariants(), "mt-6 h-10 px-4")}
          >
            <ArrowLeft className="size-4" /> My tickets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto mb-6 max-w-2xl">
        <Link
          to="/my-tickets"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" /> My tickets
        </Link>
      </div>
      <DigitalTicket
        ticket={ticketQuery.data}
        attendeeName={user?.name ?? "Attendee"}
        detailed
        allowDownload
        isRemoving={removeMutation.isPending}
        onRemove={
          ticketQuery.data.status === "cancelled"
            ? () => {
                if (window.confirm("Remove this cancelled ticket from My Tickets?"))
                  removeMutation.mutate();
              }
            : undefined
        }
      />
    </main>
  );
}
