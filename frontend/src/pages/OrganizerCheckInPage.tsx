import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Keyboard,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  TicketCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invalidateEventManagementData } from "@/lib/query-invalidation";
import { queryKeys } from "@/lib/query-keys";
import { checkInTicket, getTicketApiError } from "@/services/tickets";
import type {
  CheckInErrorCode,
  CheckInSummary,
  TicketApiError,
} from "@/types/tickets";

type CameraState = "idle" | "starting" | "scanning" | "unavailable";

const errorHeading: Record<CheckInErrorCode, string> = {
  EVENT_NOT_FOUND: "Event not found",
  CHECK_IN_FORBIDDEN: "Check-in unavailable",
  INVALID_CHECK_IN_INPUT: "Invalid ticket",
  TICKET_NOT_FOUND: "Invalid ticket",
  WRONG_EVENT: "Wrong event",
  TICKET_CANCELLED: "Cancelled ticket",
  ALREADY_CHECKED_IN: "Already checked in",
  TICKET_INACTIVE: "Invalid ticket",
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OrganizerCheckInPage() {
  const { eventId = "" } = useParams();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckInSummary | null>(null);
  const [error, setError] = useState<TicketApiError | null>(null);
  const checkInMutation = useMutation({
    mutationFn: (credential: { qrToken: string } | { ticketCode: string }) =>
      checkInTicket(eventId, credential),
    onSuccess: async () => {
      await Promise.all([
        invalidateEventManagementData(queryClient, eventId),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
        }),
      ]);
    },
  });

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraState("idle");
  }, []);

  useEffect(
    () => () => {
      controlsRef.current?.stop();
    },
    [],
  );

  const validate = useCallback(
    async (credential: { qrToken: string } | { ticketCode: string }) => {
      if (!eventId || processingRef.current) return;
      processingRef.current = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setCameraState("idle");
      setResult(null);
      setError(null);

      try {
        const checkedIn = await checkInMutation.mutateAsync(credential);
        setResult(checkedIn);
        setManualCode("");
      } catch (requestError) {
        setError(getTicketApiError(requestError));
      } finally {
        processingRef.current = false;
      }
    },
    [checkInMutation, eventId],
  );

  const isChecking = checkInMutation.isPending;

  const startCamera = async () => {
    setResult(null);
    setError(null);
    setCameraState("starting");
    processingRef.current = false;

    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 200,
      });
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        },
        videoRef.current ?? undefined,
        (scanResult, _error, controls) => {
          if (scanResult && !processingRef.current) {
            controls.stop();
            void validate({ qrToken: scanResult.getText() });
          }
        },
      );
      controlsRef.current = controls;
      setCameraState("scanning");
    } catch {
      setCameraState("unavailable");
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setManualCode("");
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <p className="text-primary text-sm font-semibold">Organizer tools</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
          Ticket check-in
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section aria-labelledby="camera-heading">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="camera-heading" className="text-lg font-semibold">
              Scan QR code
            </h2>
            {cameraState === "scanning" && (
              <span className="flex items-center gap-2 text-sm font-medium text-emerald-500">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
                Ready to scan
              </span>
            )}
          </div>

          <div className="relative aspect-3/4 max-h-[68dvh] overflow-hidden rounded-lg border bg-black sm:aspect-4/3">
            <video
              ref={videoRef}
              muted
              playsInline
              className="size-full object-cover"
            />
            {cameraState !== "scanning" && (
              <div className="absolute inset-0 grid place-items-center bg-zinc-950 px-6 text-center text-white">
                <div>
                  {cameraState === "starting" ? (
                    <LoaderCircle className="text-primary mx-auto size-10 animate-spin motion-reduce:animate-none" />
                  ) : cameraState === "unavailable" ? (
                    <Camera className="mx-auto size-10 text-zinc-500" />
                  ) : (
                    <ScanLine
                      className="text-primary mx-auto size-12"
                      strokeWidth={1.5}
                    />
                  )}
                  <p className="mt-4 font-semibold">
                    {cameraState === "starting"
                      ? "Starting camera"
                      : cameraState === "unavailable"
                        ? "Camera unavailable"
                        : "Ready to scan"}
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-zinc-400">
                    {cameraState === "unavailable"
                      ? "Check camera permission or use manual ticket entry."
                      : "Point the camera at an EventYatwon ticket QR code."}
                  </p>
                  {cameraState !== "starting" && (
                    <Button className="mt-5 h-10 px-4" onClick={startCamera}>
                      <Camera className="size-4" /> Start camera
                    </Button>
                  )}
                </div>
              </div>
            )}
            {cameraState === "scanning" && (
              <div className="pointer-events-none absolute inset-[12%] rounded-lg border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
            )}
          </div>

          {cameraState === "scanning" && (
            <Button
              variant="outline"
              className="mt-3 h-10 w-full"
              onClick={stopCamera}
            >
              Stop camera
            </Button>
          )}

          <form
            className="mt-8 border-t pt-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (manualCode.trim()) {
                void validate({ ticketCode: manualCode.trim() });
              }
            }}
          >
            <label htmlFor="ticket-code" className="text-sm font-semibold">
              Manual ticket code or ID
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="ticket-code"
                value={manualCode}
                placeholder="TICKET-XXXXXXXXXXXXXXXX or ticket ID"
                autoComplete="off"
                className="h-11 font-mono uppercase"
                disabled={isChecking}
                onChange={(event) => setManualCode(event.target.value)}
              />
              <Button
                type="submit"
                className="h-11 px-4"
                disabled={isChecking || !manualCode.trim()}
              >
                <Keyboard className="size-4" /> Check ticket
              </Button>
            </div>
          </form>
        </section>

        <section aria-live="polite" aria-labelledby="result-heading">
          <h2 id="result-heading" className="mb-3 text-lg font-semibold">
            Validation result
          </h2>
          <div className="bg-card min-h-72 rounded-lg border p-6">
            {isChecking ? (
              <div className="grid min-h-60 place-items-center text-center">
                <div>
                  <LoaderCircle className="text-primary mx-auto size-10 animate-spin motion-reduce:animate-none" />
                  <p className="mt-4 font-semibold">Validating ticket</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Confirming this ticket with EventYatwon.
                  </p>
                </div>
              </div>
            ) : result ? (
              <div>
                <CheckCircle2
                  className="size-12 text-emerald-500"
                  strokeWidth={1.6}
                />
                <p className="mt-4 text-sm font-semibold text-emerald-500">
                  Valid ticket
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  Check-in successful
                </h3>
                <dl className="mt-6 grid gap-4 border-y py-5 text-sm">
                  <div className="flex gap-3">
                    <UserRound className="text-primary mt-0.5 size-4" />
                    <div>
                      <dt className="text-muted-foreground">Attendee</dt>
                      <dd className="mt-0.5 font-semibold">
                        {result.attendee.name}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <TicketCheck className="text-primary mt-0.5 size-4" />
                    <div>
                      <dt className="text-muted-foreground">Ticket</dt>
                      <dd className="mt-0.5 font-semibold">
                        {result.ticketType} - {result.ticketCode}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Event</dt>
                    <dd className="mt-0.5 font-semibold">
                      {result.event.title}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Checked in</dt>
                    <dd className="mt-0.5 font-semibold">
                      {timeFormatter.format(new Date(result.checkedInAt))}
                    </dd>
                  </div>
                </dl>
                <Button className="mt-5 h-10 w-full" onClick={reset}>
                  <RotateCcw className="size-4" /> Scan next ticket
                </Button>
              </div>
            ) : error ? (
              <div>
                {error.code === "ALREADY_CHECKED_IN" ? (
                  <AlertCircle
                    className="size-12 text-amber-500"
                    strokeWidth={1.6}
                  />
                ) : (
                  <XCircle
                    className="text-destructive size-12"
                    strokeWidth={1.6}
                  />
                )}
                <h3 className="mt-4 text-2xl font-semibold">
                  {error.code ? errorHeading[error.code] : "Invalid ticket"}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {error.message}
                </p>
                <Button
                  variant="outline"
                  className="mt-6 h-10 w-full"
                  onClick={reset}
                >
                  <RotateCcw className="size-4" /> Try another ticket
                </Button>
              </div>
            ) : (
              <div className="grid min-h-60 place-items-center text-center">
                <div>
                  <ScanLine
                    className="text-muted-foreground mx-auto size-10"
                    strokeWidth={1.5}
                  />
                  <p className="mt-4 font-semibold">Ready to scan</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    A validated ticket summary will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
