import { useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ImageOff,
  MapPin,
  TicketCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { TicketPdfDownloadButton } from "@/components/TicketPdfDownloadButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RegistrationEvent } from "@/types/registrations";
import type { Ticket } from "@/types/tickets";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DigitalTicket({
  ticket,
  attendeeName,
  detailed = false,
  allowDownload = false,
  isRemoving = false,
  onRemove,
}: {
  ticket: Ticket;
  attendeeName: string;
  detailed?: boolean;
  allowDownload?: boolean;
  isRemoving?: boolean;
  onRemove?(): void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const event = ticket.event as RegistrationEvent;
  const hasBanner = Boolean(event.banner) && !imageFailed;
  const validQr = Boolean(ticket.qrToken) && ticket.status === "active";

  return (
    <article
      className={cn(
        "bg-card text-card-foreground mx-auto w-full overflow-hidden rounded-lg border shadow-sm",
        detailed ? "max-w-2xl" : "max-w-xl",
      )}
    >
      <div
        className={cn(
          "bg-muted relative",
          detailed ? "aspect-16/7" : "aspect-16/8",
        )}
      >
        {hasBanner ? (
          <img
            src={event.banner ?? undefined}
            alt={`${event.title} banner`}
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="text-muted-foreground grid size-full place-items-center">
            <ImageOff className="size-10" strokeWidth={1.4} />
          </div>
        )}
        <span
          className={cn(
            "absolute top-3 right-3 rounded-md px-2.5 py-1 text-xs font-semibold capitalize shadow-sm",
            ticket.status === "active"
              ? "bg-emerald-500 text-white"
              : ticket.status === "used"
                ? "bg-zinc-900 text-white"
                : "bg-destructive text-white",
          )}
        >
          {ticket.status}
        </span>
      </div>

      <div
        className={cn("grid", detailed && "sm:grid-cols-[minmax(0,1fr)_17rem]")}
      >
        <div className="min-w-0 p-5 sm:p-6">
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            EventYatwon pass
          </p>
          <h2 className="text-foreground mt-2 text-2xl leading-tight font-semibold tracking-normal">
            {event.title}
          </h2>

          <dl className="mt-6 grid gap-4 text-sm">
            <div className="flex gap-3">
              <UserRound className="text-primary mt-0.5 size-4 shrink-0" />
              <div>
                <dt className="text-muted-foreground text-xs">Attendee</dt>
                <dd className="mt-0.5 font-medium">{attendeeName}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="text-primary mt-0.5 size-4 shrink-0" />
              <div>
                <dt className="text-muted-foreground text-xs">Date and time</dt>
                <dd className="mt-0.5 font-medium">
                  {dateFormatter.format(new Date(event.startDate))}
                </dd>
              </div>
            </div>
            <div className="flex min-w-0 gap-3">
              <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <dt className="text-muted-foreground text-xs">Venue</dt>
                <dd className="mt-0.5 font-medium">{event.venue.name}</dd>
                {detailed && (
                  <dd className="text-muted-foreground mt-0.5">
                    {event.venue.address}
                  </dd>
                )}
              </div>
            </div>
          </dl>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed pt-5">
            <div>
              <p className="text-muted-foreground text-xs">Ticket type</p>
              <p className="mt-1 font-semibold">{ticket.ticketType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Check-in</p>
              <p className="mt-1 flex items-center gap-1.5 font-semibold">
                {ticket.checkedIn ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <TicketCheck className="text-muted-foreground size-4" />
                )}
                {ticket.checkedIn ? "Checked in" : "Not checked in"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-t border-dashed p-5 sm:p-6">
          <span className="bg-background absolute top-0 left-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border" />
          <span className="bg-background absolute top-0 right-0 size-5 translate-x-1/2 -translate-y-1/2 rounded-full border" />
          <div
            ref={qrContainerRef}
            className="mx-auto w-fit rounded-lg bg-white p-3"
          >
            {ticket.qrToken ? (
              <QRCodeSVG
                value={ticket.qrToken}
                size={detailed ? 220 : 164}
                level="M"
                marginSize={0}
                className={cn(
                  "h-auto w-full max-w-55",
                  !validQr && "opacity-30",
                )}
                aria-label={`QR code for ticket ${ticket.ticketCode}`}
              />
            ) : (
              <div className="grid size-41 place-items-center text-center text-xs text-zinc-500">
                QR unavailable
              </div>
            )}
          </div>
          <p className="text-foreground mt-4 text-center font-mono text-sm font-semibold tracking-[0.08em]">
            {ticket.ticketCode}
          </p>
          <p className="text-muted-foreground mt-1 text-center text-xs">
            {validQr
              ? "Present this code at entry"
              : "This ticket is not valid for entry"}
          </p>
        </div>
      </div>

      {(!detailed || allowDownload || onRemove) && (
        <div className="grid gap-2 border-t px-5 py-4 sm:grid-cols-2 sm:px-6">
          {!detailed && (
            <Link
              to={`/tickets/${ticket._id}`}
              className={cn(buttonVariants(), "h-10 w-full px-4")}
            >
              View ticket
            </Link>
          )}
          {allowDownload && (
            <TicketPdfDownloadButton
              ticket={ticket}
              attendeeName={attendeeName}
              qrContainerRef={qrContainerRef}
              className={cn("h-10 w-full px-4", detailed && "sm:col-span-2")}
            />
          )}
          {onRemove && (
            <Button
              variant="outline"
              className="text-destructive h-10 w-full px-4 sm:col-span-2 sm:mt-1"
              disabled={isRemoving}
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              {isRemoving ? "Removing" : "Remove ticket"}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
