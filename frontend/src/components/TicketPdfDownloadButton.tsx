import { useState, type RefObject } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadTicketPdf } from "@/lib/ticket-pdf";
import type { Ticket } from "@/types/tickets";

export function TicketPdfDownloadButton({
  ticket,
  attendeeName,
  qrContainerRef,
  className,
}: {
  ticket: Ticket;
  attendeeName: string;
  qrContainerRef: RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const unavailable =
    ticket.status === "cancelled" || ticket.status === "expired";
  const unavailableReason = !ticket.qrToken
    ? "QR code unavailable"
    : unavailable
      ? `${ticket.status} ticket`
      : "";

  const download = async () => {
    setIsGenerating(true);
    try {
      await downloadTicketPdf({
        ticket,
        attendeeName,
        qrSvg: qrContainerRef.current?.querySelector("svg") ?? null,
      });
      toast.success("Ticket PDF downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Ticket PDF could not be generated.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isGenerating || unavailable || !ticket.qrToken}
      title={unavailableReason || undefined}
      onClick={download}
    >
      {isGenerating ? (
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <Download className="size-4" />
      )}
      {isGenerating
        ? "Generating PDF"
        : unavailableReason
          ? "PDF unavailable"
          : "Download PDF"}
    </Button>
  );
}
