import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  createReview,
  deleteReview,
  getEventReviews,
  getReviewErrorMessage,
  updateReview,
} from "@/services/reviews";
import type { Event } from "@/types/events";
import type { Review } from "@/types/reviews";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            "size-4",
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const displayedRating = hoveredRating || value;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
    onChange(Math.min(5, Math.max(1, (value || 1) + direction)));
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium">Your rating</legend>
      <div
        className="mt-2 flex w-fit gap-1"
        onMouseLeave={() => setHoveredRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus-visible:ring-ring rounded-md p-1.5 focus-visible:ring-2 focus-visible:outline-none"
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={value === star}
            onClick={() => onChange(star)}
            onFocus={() => setHoveredRating(star)}
            onBlur={() => setHoveredRating(0)}
            onMouseEnter={() => setHoveredRating(star)}
            onKeyDown={handleKeyDown}
          >
            <Star
              aria-hidden="true"
              className={cn(
                "size-7 transition-colors",
                star <= displayedRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40 hover:text-amber-300",
              )}
            />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewCard({
  review,
  isOwner,
  isDeleting,
  onEdit,
  onDelete,
}: {
  review: Review;
  isOwner: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{review.user.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={review.rating} />
            <time className="text-muted-foreground text-xs">
              {dateFormatter.format(new Date(review.createdAt))}
            </time>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit review"
              title="Edit review"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete review"
              title="Delete review"
              disabled={isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Trash2 className="text-destructive size-4" />
              )}
            </Button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground mt-3 leading-7 whitespace-pre-wrap">
        {review.comment}
      </p>
    </article>
  );
}

export function ReviewsSection({ event }: { event: Event }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviews.list(event._id, page, user?.id ?? "guest"),
    queryFn: () => getEventReviews(event._id, page),
    enabled: !isAuthLoading,
    staleTime: 30_000,
  });
  const data = reviewsQuery.data;
  const ownReview = data?.myReview;

  const refreshReviews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.all(event._id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(event.slug),
      }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async (input: { rating: number; comment: string }) => {
      if (editingId) return updateReview(editingId, input);
      return createReview(event._id, input);
    },
    onSuccess: async () => {
      toast.success(editingId ? "Review updated" : "Review published");
      setEditingId(undefined);
      setRating(0);
      setComment("");
      setPage(1);
      await refreshReviews();
    },
    onError: (error) => toast.error(getReviewErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: async () => {
      toast.success("Review deleted");
      setEditingId(undefined);
      setPage(1);
      await refreshReviews();
    },
    onError: (error) => toast.error(getReviewErrorMessage(error)),
  });

  const editReview = (review: Review) => {
    setEditingId(review._id);
    setRating(review.rating);
    setComment(review.comment);
  };

  const removeReview = (reviewId: string) => {
    if (window.confirm("Delete this review?")) removeMutation.mutate(reviewId);
  };

  const submit = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Choose a rating from 1 to 5 stars");
      return;
    }
    if (!comment.trim()) {
      toast.error("Comment is required");
      return;
    }
    saveMutation.mutate({ rating, comment: comment.trim() });
  };

  const showForm = Boolean(data?.eligibility.canReview || editingId);
  const ownReviewIsVisible = Boolean(
    ownReview && data?.reviews.some((review) => review._id === ownReview._id),
  );

  return (
    <section className="mt-12 border-t pt-10" aria-labelledby="reviews-title">
      <div>
        <h2 id="reviews-title" className="text-2xl font-semibold">
          Reviews
        </h2>
        {data && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold">
              {data.summary.averageRating.toFixed(1)}
            </span>
            <Stars rating={Math.round(data.summary.averageRating)} />
            <span className="text-muted-foreground text-sm">
              {data.summary.totalReviews} review
              {data.summary.totalReviews === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {reviewsQuery.isPending ? (
        <div className="mt-8 space-y-3" aria-label="Loading reviews">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="bg-muted h-28 animate-pulse rounded-lg motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : reviewsQuery.isError ? (
        <div className="mt-8 border-y py-10 text-center">
          <p className="text-destructive">
            {getReviewErrorMessage(reviewsQuery.error)}
          </p>
          <Button className="mt-4" onClick={() => void reviewsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : data ? (
        <>
          {data.eligibility.reason === "not_authenticated" && (
            <div className="bg-muted/30 mt-6 rounded-lg border p-5">
              <p className="text-muted-foreground">
                Sign in to leave a review.
              </p>
              <Link
                to="/login"
                state={{ from: `/events/${event.slug}` }}
                className={cn(buttonVariants(), "mt-4")}
              >
                Sign in
              </Link>
            </div>
          )}

          {data.eligibility.reason === "not_registered" && (
            <p className="bg-muted/30 text-muted-foreground mt-6 rounded-lg border p-5">
              Only attendees who registered for this event can leave a review.
            </p>
          )}

          {data.eligibility.reason === "event_not_ended" && (
            <p className="bg-muted/30 text-muted-foreground mt-6 rounded-lg border p-5">
              Reviews will be available after this event ends.
            </p>
          )}

          {ownReview && !editingId && (
            <div className="bg-muted/30 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-5">
              <p className="font-medium">Your review is published.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => editReview(ownReview)}>
                  <Pencil className="size-4" /> Edit review
                </Button>
                <Button
                  variant="destructive"
                  disabled={removeMutation.isPending}
                  onClick={() => removeReview(ownReview._id)}
                >
                  <Trash2 className="size-4" /> Delete review
                </Button>
              </div>
            </div>
          )}

          {showForm && (
            <form
              onSubmit={submit}
              className="bg-muted/25 mt-6 rounded-lg border p-5 sm:p-6"
            >
              <h3 className="text-lg font-semibold">
                {editingId ? "Edit review" : "Write a review"}
              </h3>
              <div className="mt-5">
                <RatingInput value={rating} onChange={setRating} />
              </div>
              <label
                htmlFor="review-comment"
                className="mt-5 block text-sm font-medium"
              >
                Comment
              </label>
              <textarea
                id="review-comment"
                value={comment}
                required
                maxLength={2000}
                rows={5}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/20 mt-2 w-full resize-y rounded-lg border px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
                onChange={(inputEvent) => setComment(inputEvent.target.value)}
              />
              <div className="text-muted-foreground mt-1 text-right text-xs">
                {comment.length} / 2000
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                  )}
                  {editingId ? "Save changes" : "Submit review"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(undefined);
                      setRating(0);
                      setComment("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}

          {ownReview && !ownReviewIsVisible && !editingId && (
            <div className="mt-8 border-y">
              <ReviewCard
                review={ownReview}
                isOwner
                isDeleting={removeMutation.isPending}
                onEdit={() => editReview(ownReview)}
                onDelete={() => removeReview(ownReview._id)}
              />
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((value) => {
                const count =
                  data.summary.distribution.find(
                    (item) => item.rating === value,
                  )?.count ?? 0;
                const percent = data.summary.totalReviews
                  ? (count / data.summary.totalReviews) * 100
                  : 0;
                return (
                  <div
                    key={value}
                    className="grid grid-cols-[1.5rem_1fr_2rem] items-center gap-2 text-sm"
                  >
                    <span>{value}</span>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div>
              {data.reviews.length ? (
                <div className="divide-y border-y">
                  {data.reviews.map((review) => (
                    <ReviewCard
                      key={review._id}
                      review={review}
                      isOwner={review.user._id === user?.id}
                      isDeleting={
                        removeMutation.isPending &&
                        removeMutation.variables === review._id
                      }
                      onEdit={() => editReview(review)}
                      onDelete={() => removeReview(review._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground border-y py-10 text-center">
                  No reviews yet.
                </div>
              )}

              {data.pagination.pages > 1 && (
                <div className="mt-5 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    aria-label="Previous reviews"
                    onClick={() => setPage((value) => value - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {page} of {data.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= data.pagination.pages}
                    aria-label="Next reviews"
                    onClick={() => setPage((value) => value + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
