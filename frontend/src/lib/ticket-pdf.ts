import type { RegistrationEvent } from "@/types/registrations";
import type { Ticket } from "@/types/tickets";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeStyle: "short",
});

const sanitizeFilename = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "Event";

const svgToPng = (svg: SVGSVGElement, size = 1000): Promise<string> =>
  new Promise((resolve, reject) => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(size));
    clone.setAttribute("height", String(size));
    const source = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(
      new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
    );
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("QR image could not be created");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("QR image could not be created"));
    };
    image.src = url;
  });

const loadBanner = async (url: string): Promise<string | undefined> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return undefined;

    return await new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1600;
          canvas.height = 400;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Banner image could not be prepared");
          const scale = Math.max(
            canvas.width / image.width,
            canvas.height / image.height,
          );
          const width = image.width * scale;
          const height = image.height * scale;
          context.drawImage(
            image,
            (canvas.width - width) / 2,
            (canvas.height - height) / 2,
            width,
            height,
          );
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Banner image could not be prepared"));
      };
      image.src = objectUrl;
    });
  } catch {
    return undefined;
  }
};

export const downloadTicketPdf = async ({
  ticket,
  attendeeName,
  qrSvg,
}: {
  ticket: Ticket;
  attendeeName: string;
  qrSvg: SVGSVGElement | null;
}): Promise<void> => {
  if (!ticket.qrToken) throw new Error("This ticket does not have a QR code.");
  if (ticket.status === "cancelled") {
    throw new Error("Cancelled tickets cannot be downloaded.");
  }
  if (ticket.status === "expired") {
    throw new Error("Expired tickets cannot be downloaded.");
  }
  if (!qrSvg) throw new Error("The ticket QR code is not ready yet.");
  if (!ticket.event || typeof ticket.event === "string") {
    throw new Error("Event information is unavailable for this ticket.");
  }

  const event = ticket.event as RegistrationEvent;
  if (
    !event.title ||
    !event.startDate ||
    !event.venue?.name ||
    !event.venue.address
  ) {
    throw new Error("Event information is incomplete for this ticket.");
  }

  const [{ jsPDF }, qrImage, bannerImage] = await Promise.all([
    import("jspdf"),
    svgToPng(qrSvg),
    event.banner ? loadBanner(event.banner) : Promise.resolve(undefined),
  ]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 16;

  pdf.setProperties({
    title: `${event.title} ticket`,
    subject: "EventYatwon event ticket",
    author: "EventYatwon",
  });

  pdf.setFillColor(5, 9, 17);
  pdf.rect(0, 0, pageWidth, 55, "F");
  pdf.setFillColor(111, 149, 232);
  pdf.rect(0, 0, 5, 55, "F");
  pdf.setTextColor(111, 149, 232);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("EventYatwon", margin, 18);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text("EVENT TICKET", margin, 28);
  pdf.setFontSize(22);
  const titleLines = pdf.splitTextToSize(event.title, 155) as string[];
  pdf.text(titleLines.slice(0, 2), margin, 40);

  let contentY = 64;
  if (bannerImage) {
    pdf.addImage(
      bannerImage,
      "JPEG",
      margin,
      contentY,
      pageWidth - margin * 2,
      42,
    );
    contentY += 51;
  }

  pdf.setTextColor(22, 26, 34);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("DATE", margin, contentY);
  pdf.text("START TIME", 74, contentY);
  pdf.text("STATUS", 132, contentY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(
    dateFormatter.format(new Date(event.startDate)),
    margin,
    contentY + 7,
  );
  pdf.text(timeFormatter.format(new Date(event.startDate)), 74, contentY + 7);
  pdf.setFont("helvetica", "bold");
  pdf.text(ticket.status.toUpperCase(), 132, contentY + 7);

  contentY += 21;
  pdf.setDrawColor(220, 224, 232);
  pdf.line(margin, contentY, pageWidth - margin, contentY);
  contentY += 11;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("VENUE", margin, contentY);
  pdf.setFontSize(13);
  pdf.text(event.venue.name, margin, contentY + 7);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(event.venue.address, margin, contentY + 13);

  contentY += 27;
  pdf.setFillColor(246, 248, 252);
  pdf.roundedRect(margin, contentY, 100, 58, 2, 2, "F");
  const details = [
    ["ATTENDEE", attendeeName],
    ["TICKET TYPE", ticket.ticketType],
    ["TICKET CODE", ticket.ticketCode],
  ];
  details.forEach(([label, value], index) => {
    const y = contentY + 10 + index * 16;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(92, 101, 117);
    pdf.text(label, margin + 6, y);
    pdf.setFontSize(11);
    pdf.setTextColor(22, 26, 34);
    pdf.text(pdf.splitTextToSize(value, 86)[0], margin + 6, y + 6);
  });

  const qrX = 132;
  const qrY = contentY - 3;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 224, 232);
  pdf.roundedRect(qrX - 4, qrY - 4, 66, 66, 2, 2, "FD");
  pdf.addImage(qrImage, "PNG", qrX, qrY, 58, 58);

  contentY += 72;
  pdf.setTextColor(22, 26, 34);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Present this QR code at event check-in.", pageWidth / 2, contentY, {
    align: "center",
  });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(92, 101, 117);
  pdf.text(
    "Keep this ticket private. Each QR code is unique and can only be checked in once.",
    pageWidth / 2,
    contentY + 7,
    { align: "center" },
  );

  pdf.setDrawColor(220, 224, 232);
  pdf.line(margin, 280, pageWidth - margin, 280);
  pdf.setFontSize(8);
  pdf.text("EventYatwon digital ticket", margin, 287);
  pdf.text(ticket.ticketCode, pageWidth - margin, 287, { align: "right" });

  pdf.save(`EventYatwon-${sanitizeFilename(event.title)}-Ticket.pdf`);
};
