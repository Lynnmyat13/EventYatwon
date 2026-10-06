import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  addFavorite,
  getFavoriteStatus,
  removeFavorite,
} from "@/services/favorites";
import type { Favorite } from "@/types/favorites";

interface FavoriteButtonProps {
  eventId: string;
  eventSlug: string;
  initialFavorite?: boolean;
  isStatusLoading?: boolean;
  showLabel?: boolean;
  className?: string;
  onChange?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  eventId,
  eventSlug,
  initialFavorite,
  isStatusLoading = false,
  showLabel = false,
  className,
  onChange,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: queryKeys.favorites.status(eventId),
    queryFn: () => getFavoriteStatus(eventId),
    enabled: Boolean(user) && initialFavorite === undefined && !isStatusLoading,
    staleTime: 60_000,
  });
  const serverStatus = statusQuery.data ?? initialFavorite ?? false;
  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) return addFavorite(eventId);
      await removeFavorite(eventId);
      return undefined;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.favorites.status(eventId),
      });
      const previous = queryClient.getQueryData<boolean>(
        queryKeys.favorites.status(eventId),
      );
      const previousFavorites = queryClient.getQueryData<Favorite[]>(
        queryKeys.favorites.all,
      );
      queryClient.setQueryData(queryKeys.favorites.status(eventId), next);
      if (!next) {
        queryClient.setQueryData<Favorite[]>(queryKeys.favorites.all, (items) =>
          items?.filter(
            (item) =>
              (typeof item.event === "string" ? item.event : item.event._id) !==
              eventId,
          ),
        );
      }
      return { previous, previousFavorites };
    },
    onSuccess: (favorite, next) => {
      queryClient.setQueryData(queryKeys.favorites.status(eventId), next);
      if (favorite) {
        queryClient.setQueryData<Favorite[]>(
          queryKeys.favorites.all,
          (items = []) => [
            favorite,
            ...items.filter((item) => item._id !== favorite._id),
          ],
        );
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
      onChange?.(next);
      toast.success(next ? "Event saved" : "Removed from saved events");
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(
        queryKeys.favorites.status(eventId),
        context?.previous ?? serverStatus,
      );
      queryClient.setQueryData(
        queryKeys.favorites.all,
        context?.previousFavorites,
      );
      toast.error("Could not update saved events");
    },
  });
  const isFavorite = user
    ? mutation.isPending
      ? mutation.variables
      : serverStatus
    : false;
  const isLoading =
    Boolean(user) && initialFavorite === undefined && statusQuery.isPending;

  const toggle = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${eventSlug}` } });
      return;
    }

    mutation.mutate(!isFavorite);
  };

  const busy = isLoading || isStatusLoading || mutation.isPending;
  const label = isFavorite ? "Remove from saved events" : "Save event";

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? "default" : "icon"}
      className={cn(showLabel && "h-11", className)}
      disabled={busy}
      aria-label={label}
      title={label}
      aria-pressed={isFavorite}
      onClick={toggle}
    >
      {isLoading || isStatusLoading ? (
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <Heart className={cn("size-4", isFavorite && "fill-current")} />
      )}
      {showLabel && (isFavorite ? "Saved" : "Favorite")}
    </Button>
  );
}
