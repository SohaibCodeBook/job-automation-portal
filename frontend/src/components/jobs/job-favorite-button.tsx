"use client";

import { Heart } from "lucide-react";

import { useJobFavorites } from "@/hooks/use-job-favorites";
import { cn } from "@/lib/utils";

type JobFavoriteButtonProps = {
  listingId: string;
  initialFavorited?: boolean;
  className?: string;
};

export function JobFavoriteButton({
  listingId,
  initialFavorited = false,
  className,
}: JobFavoriteButtonProps) {
  const { isFavorite, isToggling, toggleFavorite, isLoading } = useJobFavorites();
  const favorited = isFavorite(listingId) || (isLoading && initialFavorited);
  const toggling = isToggling(listingId);

  return (
    <button
      type="button"
      className={cn(
        "job-card-favorite-btn",
        favorited && "job-card-favorite-btn--active",
        className,
      )}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={favorited}
      disabled={toggling}
      onClick={(event) => {
        event.stopPropagation();
        void toggleFavorite(listingId);
      }}
    >
      <Heart
        className={cn("size-4", favorited && "fill-current")}
        strokeWidth={favorited ? 0 : 1.75}
        aria-hidden
      />
    </button>
  );
}
