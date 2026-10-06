import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ImageOff,
  LoaderCircle,
  MapPin,
  Plus,
  Save,
  Ticket,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  type FieldError as HookFormFieldError,
  type FieldPath,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { createEvent, getEventErrorMessage } from "@/services/events";
import type { CreateEventInput } from "@/types/events";

const ticketSchema = z.object({
  name: z.string().trim().min(1, "Ticket name is required").max(80),
  price: z.number().min(0, "Price cannot be negative"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

const isHttpUrl = (value: string): boolean => {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Use at least 3 characters").max(160),
    category: z.string().trim().min(2, "Category is required").max(80),
    description: z
      .string()
      .trim()
      .min(20, "Use at least 20 characters")
      .max(5000),
    startDate: z.string().min(1, "Start date and time are required"),
    endDate: z.string().min(1, "End date and time are required"),
    venue: z.object({
      name: z.string().trim().min(2, "Venue name is required").max(160),
      address: z.string().trim().min(5, "Venue address is required").max(300),
    }),
    capacity: z
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1"),
    ticketTypes: z.array(ticketSchema).min(1, "Add at least one ticket type"),
    banner: z
      .string()
      .trim()
      .max(2000)
      .refine(isHttpUrl, "Enter a valid HTTP or HTTPS banner URL"),
  })
  .superRefine((values, context) => {
    if (
      values.startDate &&
      values.endDate &&
      new Date(values.endDate) <= new Date(values.startDate)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End must be after the start",
      });
    }

    const totalTickets = values.ticketTypes.reduce(
      (total, ticketType) => total + ticketType.quantity,
      0,
    );
    if (totalTickets > values.capacity) {
      context.addIssue({
        code: "custom",
        path: ["ticketTypes"],
        message: "Total ticket quantity cannot exceed capacity",
      });
    }
  });

type EventForm = z.infer<typeof eventSchema>;

const steps = [
  "Basic Information",
  "Date & Time",
  "Venue",
  "Tickets & Capacity",
  "Banner",
  "Preview",
] as const;

const stepFields: FieldPath<EventForm>[][] = [
  ["title", "category", "description"],
  ["startDate", "endDate"],
  ["venue.name", "venue.address"],
  ["capacity", "ticketTypes"],
  ["banner"],
  [],
];

const inputLabel = "mb-2 block text-sm font-medium text-foreground";
const textAreaClass =
  "min-h-36 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20";

function FieldError({ error }: { error?: HookFormFieldError }) {
  if (!error) return null;
  return (
    <p className="text-destructive mt-1.5 text-sm" role="alert">
      {error.message}
    </p>
  );
}

const localDate = (value: string): string => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState("");
  const [failedBanner, setFailedBanner] = useState("");
  const [bannerFile, setBannerFile] = useState<File>();
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerError, setBannerError] = useState("");
  const {
    control,
    register,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      category: "",
      description: "",
      startDate: "",
      endDate: "",
      venue: { name: "", address: "" },
      capacity: 100,
      ticketTypes: [{ name: "General", price: 0, quantity: 100 }],
      banner: "",
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });
  const values = watch();
  const createMutation = useMutation({
    mutationFn: ({ input, file }: { input: CreateEventInput; file?: File }) =>
      createEvent(input, file),
    onSuccess: async (event, { input }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.organizers.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizerEvents.all,
        }),
      ]);
      toast.success(input.status === "draft" ? "Draft saved" : "Event created");
      navigate(
        input.status === "published"
          ? `/events/${event.slug}`
          : `/organizer/events/${event._id}/manage?tab=settings`,
      );
    },
  });

  useEffect(
    () => () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    },
    [bannerPreview],
  );

  const chooseBanner = (file?: File) => {
    setBannerError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBannerError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerError("Banner image must be 8 MB or smaller.");
      return;
    }
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setFailedBanner("");
  };

  const clearBannerFile = () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(undefined);
    setBannerPreview("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const clearBanner = () => {
    clearBannerFile();
    setValue("banner", "", { shouldDirty: true, shouldValidate: true });
    setFailedBanner("");
  };

  const nextStep = async () => {
    if (await trigger(stepFields[step], { shouldFocus: true })) {
      setStep((current) => Math.min(current + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submit = async (status: "draft" | "published") => {
    setApiError("");
    if (!(await trigger(undefined, { shouldFocus: true }))) return;
    try {
      const form = getValues();
      const input: CreateEventInput = {
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        banner: form.banner.trim() || null,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        venue: {
          name: form.venue.name.trim(),
          address: form.venue.address.trim(),
        },
        capacity: form.capacity,
        ticketTypes: form.ticketTypes.map((ticketType) => ({
          name: ticketType.name.trim(),
          price: ticketType.price,
          quantity: ticketType.quantity,
        })),
        status,
      };
      await createMutation.mutateAsync({ input, file: bannerFile });
    } catch (error) {
      setApiError(getEventErrorMessage(error, "Event could not be saved."));
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-semibold">Organizer tools</p>
        <h1 className="text-foreground mt-2 text-4xl font-semibold tracking-normal">
          Create event
        </h1>
        <p className="text-muted-foreground mt-3 leading-7">
          Complete each step, review the details, then save a draft or publish.
        </p>
      </div>

      <ol className="bg-border mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-3 lg:grid-cols-6">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`bg-background min-w-0 px-3 py-3 ${index === step ? "text-primary" : index < step ? "text-foreground" : "text-muted-foreground"}`}
            aria-current={index === step ? "step" : undefined}
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${index <= step ? "border-primary" : "border-border"}`}
              >
                {index < step ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="truncate text-xs font-medium">{label}</span>
            </div>
          </li>
        ))}
      </ol>

      {apiError && (
        <div
          className="border-destructive/40 bg-destructive/10 text-destructive mt-6 rounded-lg border px-4 py-3 text-sm"
          role="alert"
        >
          {apiError}
        </div>
      )}

      <form onSubmit={(event) => event.preventDefault()} className="mt-8">
        <div className="min-h-[26rem] border-y py-8">
          {step === 0 && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-foreground text-2xl font-semibold">
                  Basic information
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Give people a clear reason to attend.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="event-title" className={inputLabel}>
                    Event title
                  </label>
                  <Input
                    id="event-title"
                    placeholder="Yangon Design Meetup"
                    {...register("title")}
                  />
                  <FieldError error={errors.title} />
                </div>
                <div>
                  <label htmlFor="event-category" className={inputLabel}>
                    Category
                  </label>
                  <Input
                    id="event-category"
                    placeholder="Design"
                    {...register("category")}
                  />
                  <FieldError error={errors.category} />
                </div>
              </div>
              <div>
                <label htmlFor="event-description" className={inputLabel}>
                  Description
                </label>
                <textarea
                  id="event-description"
                  placeholder="Describe the event, audience, and what attendees can expect."
                  className={textAreaClass}
                  {...register("description")}
                />
                <FieldError error={errors.description} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-foreground text-2xl font-semibold">
                  Date and time
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Set when the event begins and ends.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="event-start" className={inputLabel}>
                    Starts
                  </label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    {...register("startDate")}
                  />
                  <FieldError error={errors.startDate} />
                </div>
                <div>
                  <label htmlFor="event-end" className={inputLabel}>
                    Ends
                  </label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    {...register("endDate")}
                  />
                  <FieldError error={errors.endDate} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-foreground text-2xl font-semibold">
                  Venue
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Add the venue name and address attendees should use.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="venue-name" className={inputLabel}>
                    Venue name
                  </label>
                  <Input
                    id="venue-name"
                    placeholder="Convention Hall"
                    {...register("venue.name")}
                  />
                  <FieldError error={errors.venue?.name} />
                </div>
                <div>
                  <label htmlFor="venue-address" className={inputLabel}>
                    Address
                  </label>
                  <Input
                    id="venue-address"
                    placeholder="1 Main Street, Yangon"
                    {...register("venue.address")}
                  />
                  <FieldError error={errors.venue?.address} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-foreground text-2xl font-semibold">
                  Tickets and capacity
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Ticket quantities must fit within the venue capacity.
                </p>
              </div>
              <div className="max-w-xs">
                <label htmlFor="event-capacity" className={inputLabel}>
                  Total capacity
                </label>
                <Input
                  id="event-capacity"
                  type="number"
                  min="1"
                  {...register("capacity", { valueAsNumber: true })}
                />
                <FieldError error={errors.capacity} />
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-4 border-t pt-4 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-end"
                  >
                    <div>
                      <label
                        htmlFor={`ticket-${field.id}-name`}
                        className={inputLabel}
                      >
                        Ticket name
                      </label>
                      <Input
                        id={`ticket-${field.id}-name`}
                        {...register(`ticketTypes.${index}.name`)}
                      />
                      <FieldError error={errors.ticketTypes?.[index]?.name} />
                    </div>
                    <div>
                      <label
                        htmlFor={`ticket-${field.id}-price`}
                        className={inputLabel}
                      >
                        Price (Ks)
                      </label>
                      <Input
                        id={`ticket-${field.id}-price`}
                        type="number"
                        min="0"
                        step="any"
                        {...register(`ticketTypes.${index}.price`, {
                          valueAsNumber: true,
                        })}
                      />
                      <FieldError error={errors.ticketTypes?.[index]?.price} />
                    </div>
                    <div>
                      <label
                        htmlFor={`ticket-${field.id}-quantity`}
                        className={inputLabel}
                      >
                        Quantity
                      </label>
                      <Input
                        id={`ticket-${field.id}-quantity`}
                        type="number"
                        min="1"
                        {...register(`ticketTypes.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      <FieldError
                        error={errors.ticketTypes?.[index]?.quantity}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      disabled={fields.length === 1}
                      aria-label={`Remove ${field.name} ticket`}
                      title="Remove ticket"
                      onClick={() => remove(index)}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                ))}
                {errors.ticketTypes?.message && (
                  <p className="text-destructive text-sm" role="alert">
                    {errors.ticketTypes.message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4"
                  onClick={() => append({ name: "", price: 0, quantity: 1 })}
                >
                  <Plus aria-hidden="true" className="size-4" /> Add ticket type
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
              <div>
                <h2 className="text-foreground text-2xl font-semibold">
                  Banner
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Click the preview to upload an image, or use a public image
                  URL.
                </p>
                <div className="mt-6">
                  <Input
                    ref={bannerInputRef}
                    id="event-banner-file"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(event) => chooseBanner(event.target.files?.[0])}
                  />
                  <p className="text-muted-foreground mt-2 text-xs">
                    JPEG, PNG, WebP, GIF, or AVIF. Maximum 8 MB.
                  </p>
                  {bannerError && (
                    <p className="text-destructive mt-2 text-sm" role="alert">
                      {bannerError}
                    </p>
                  )}
                </div>
                <div className="mt-6 border-t pt-5">
                  <label htmlFor="event-banner" className={inputLabel}>
                    Banner URL fallback
                  </label>
                  <Input
                    id="event-banner"
                    type="url"
                    placeholder="https://example.com/event.jpg"
                    {...register("banner")}
                  />
                  <FieldError error={errors.banner} />
                </div>
              </div>
              <div className="group bg-muted relative aspect-[16/9] overflow-hidden rounded-lg border">
                {(bannerPreview || values.banner) &&
                failedBanner !== (bannerPreview || values.banner) ? (
                  <img
                    src={bannerPreview || values.banner}
                    alt="Event banner preview"
                    className="size-full object-cover"
                    onError={() =>
                      setFailedBanner(bannerPreview || values.banner)
                    }
                  />
                ) : (
                  <div className="text-muted-foreground grid size-full place-items-center text-center">
                    <div>
                      <ImageOff
                        aria-hidden="true"
                        className="mx-auto size-8"
                        strokeWidth={1.4}
                      />
                      <p className="mt-2 text-sm">Click to upload a banner</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="focus-visible:ring-ring absolute inset-0 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  aria-label="Choose banner image"
                  onClick={() => bannerInputRef.current?.click()}
                />
                {(bannerPreview || values.banner) && (
                  <button
                    type="button"
                    className="bg-destructive text-destructive-foreground absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                    aria-label="Remove banner image"
                    onClick={clearBanner}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="max-w-2xl">
                <h2 className="text-foreground text-2xl font-semibold">
                  Preview
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Review the event before saving or publishing.
                </p>
              </div>
              <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                  {(bannerPreview || values.banner) &&
                  failedBanner !== (bannerPreview || values.banner) ? (
                    <img
                      src={bannerPreview || values.banner}
                      alt=""
                      className="bg-muted aspect-[16/7] w-full rounded-lg object-cover"
                      onError={() =>
                        setFailedBanner(bannerPreview || values.banner)
                      }
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground grid aspect-[16/7] place-items-center rounded-lg">
                      <ImageOff aria-hidden="true" className="size-9" />
                    </div>
                  )}
                  <p className="text-primary mt-5 text-sm font-semibold">
                    {values.category}
                  </p>
                  <h3 className="text-foreground mt-2 text-3xl font-semibold tracking-normal">
                    {values.title}
                  </h3>
                  <p className="text-muted-foreground mt-4 leading-7 whitespace-pre-wrap">
                    {values.description}
                  </p>
                </div>
                <dl className="space-y-5 border-l-0 lg:border-l lg:pl-6">
                  <div className="flex gap-3">
                    <CalendarDays
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-5 shrink-0"
                    />
                    <div>
                      <dt className="text-muted-foreground text-sm">Date</dt>
                      <dd className="text-foreground mt-1 font-medium">
                        {localDate(values.startDate)}
                      </dd>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        to {localDate(values.endDate)}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-5 shrink-0"
                    />
                    <div>
                      <dt className="text-muted-foreground text-sm">Venue</dt>
                      <dd className="text-foreground mt-1 font-medium">
                        {values.venue.name}
                      </dd>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        {values.venue.address}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Ticket
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-5 shrink-0"
                    />
                    <div>
                      <dt className="text-muted-foreground text-sm">Tickets</dt>
                      <dd className="text-foreground mt-1 font-medium">
                        {values.ticketTypes.length} type
                        {values.ticketTypes.length === 1 ? "" : "s"}
                      </dd>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        Capacity {values.capacity}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4"
            disabled={step === 0 || isSubmitting}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Previous
          </Button>

          {step < steps.length - 1 ? (
            <Button type="button" className="h-11 px-4" onClick={nextStep}>
              Next <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-4"
                disabled={isSubmitting}
                onClick={() => submit("draft")}
              >
                {isSubmitting ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}{" "}
                Save as draft
              </Button>
              <Button
                type="button"
                className="h-11 px-4"
                disabled={isSubmitting}
                onClick={() => submit("published")}
              >
                {isSubmitting ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Check aria-hidden="true" className="size-4" />
                )}{" "}
                Create event
              </Button>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
