import { Minus, Plus, Ticket, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatTicketPrice } from "@/lib/currency";
import { invalidateRegistrationData } from "@/lib/query-invalidation";
import { registerForEvent } from "@/services/registrations";
import type { Event, EventTicketType } from "@/types/events";
import type { Registration, RegistrationApiError } from "@/types/registrations";
import { getRegistrationApiError } from "@/services/registrations";

const numberFormatter = new Intl.NumberFormat();

const ticketRemaining = (ticketType: EventTicketType): number =>
  Math.max(0, ticketType.quantity - ticketType.sold);

export function RegistrationDialog({
  event,
  onClose,
  onRegistered,
}: {
  event: Event;
  onClose(): void;
  onRegistered(registration: Registration): Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstAvailable = event.ticketTypes.find(
    (ticketType) => ticketRemaining(ticketType) > 0,
  );
  const [ticketName, setTicketName] = useState(firstAvailable?.name ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<RegistrationApiError | null>(null);
  const queryClient = useQueryClient();
  const registrationMutation = useMutation({
    mutationFn: ({
      ticketType,
      amount,
    }: {
      ticketType: string;
      amount: number;
    }) => registerForEvent(event._id, ticketType, amount),
    onSuccess: async (registration) => {
      await invalidateRegistrationData(queryClient, event.slug);
      await onRegistered(registration);
    },
  });
  const isSubmitting = registrationMutation.isPending;
  const selectedTicket = event.ticketTypes.find(
    (ticketType) => ticketType.name === ticketName,
  );
  const eventRemaining = Math.max(0, event.capacity - event.registeredCount);
  const remaining = selectedTicket
    ? Math.min(ticketRemaining(selectedTicket), eventRemaining)
    : 0;
  const total = selectedTicket ? selectedTicket.price * quantity : 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const selectTicket = (name: string) => {
    setTicketName(name);
    setQuantity(1);
    setError(null);
  };

  const confirm = async () => {
    if (!selectedTicket || remaining < 1) {
      setError({ message: "Select an available ticket type." });
      return;
    }

    setError(null);
    try {
      await registrationMutation.mutateAsync({
        ticketType: selectedTicket.name,
        amount: quantity,
      });
    } catch (requestError) {
      setError(getRegistrationApiError(requestError));
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="registration-title"
      className="bg-card text-card-foreground m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border p-0 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onClose();
      }}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-primary text-sm font-medium">Event registration</p>
          <h2
            id="registration-title"
            className="text-foreground mt-1 truncate text-xl font-semibold"
          >
            {event.title}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close registration"
          title="Close"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        {error && (
          <p
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
            role="alert"
          >
            {error.message}
          </p>
        )}

        <div>
          <label
            htmlFor="registration-ticket"
            className="text-foreground mb-2 block text-sm font-medium"
          >
            Ticket type
          </label>
          <select
            id="registration-ticket"
            value={ticketName}
            disabled={isSubmitting}
            className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/20 h-11 w-full rounded-lg border px-3 text-sm focus-visible:ring-3 focus-visible:outline-none"
            onChange={(event) => selectTicket(event.target.value)}
          >
            {event.ticketTypes.map((ticketType, index) => {
              const available = Math.min(
                ticketRemaining(ticketType),
                eventRemaining,
              );
              return (
                <option
                  key={`${ticketType.name}-${index}`}
                  value={ticketType.name}
                  disabled={available < 1}
                >
                  {ticketType.name} - {formatTicketPrice(ticketType.price)} (
                  {available} remaining)
                </option>
              );
            })}
          </select>
        </div>

        {selectedTicket && (
          <div className="grid gap-4 border-y py-5 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Price</p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {formatTicketPrice(selectedTicket.price)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Remaining</p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {numberFormatter.format(remaining)}
              </p>
            </div>
          </div>
        )}

        <div>
          <p className="text-foreground mb-2 text-sm font-medium">Quantity</p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Decrease quantity"
              title="Decrease quantity"
              disabled={isSubmitting || quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            >
              <Minus aria-hidden="true" className="size-4" />
            </Button>
            <output
              aria-live="polite"
              className="text-foreground min-w-12 text-center text-lg font-semibold"
            >
              {quantity}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Increase quantity"
              title="Increase quantity"
              disabled={isSubmitting || quantity >= remaining}
              onClick={() =>
                setQuantity((current) => Math.min(remaining, current + 1))
              }
            >
              <Plus aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/60 rounded-lg p-4">
          <h3 className="text-foreground font-semibold">
            Registration summary
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Ticket</dt>
              <dd className="text-foreground text-right font-medium">
                {selectedTicket?.name ?? "Not selected"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Quantity</dt>
              <dd className="text-foreground font-medium">{quantity}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t pt-2">
              <dt className="text-foreground font-medium">Total</dt>
              <dd className="text-foreground font-semibold">
                {formatTicketPrice(total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Button
          type="button"
          variant="outline"
          className="h-11 px-4"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="h-11 px-4"
          disabled={isSubmitting || !selectedTicket || remaining < 1}
          onClick={confirm}
        >
          {isSubmitting ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
          ) : (
            <Ticket aria-hidden="true" className="size-4" />
          )}
          {isSubmitting ? "Registering" : "Confirm registration"}
        </Button>
      </div>
    </dialog>
  );
}
