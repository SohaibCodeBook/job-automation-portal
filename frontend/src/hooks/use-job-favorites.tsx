"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import {
  addJobListingFavorite,
  getJobListingFavoritesSummary,
  removeJobListingFavorite,
} from "@/lib/api/job-listings";

type FavoriteListItem = {
  id: string;
  is_favorited?: boolean;
};

export type JobFavoritesContextValue = {
  favoriteIds: ReadonlySet<string>;
  favoritesCount: number;
  isLoading: boolean;
  isFavorite: (listingId: string) => boolean;
  isToggling: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  syncFromListItems: (items: FavoriteListItem[]) => void;
  refreshFavorites: () => void;
};

const JobFavoritesContext = React.createContext<JobFavoritesContextValue | null>(
  null,
);

export function JobFavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(() => new Set());
  const [favoritesCount, setFavoritesCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [togglingIds, setTogglingIds] = React.useState<Set<string>>(() => new Set());
  const [fetchKey, setFetchKey] = React.useState(0);

  const refreshFavorites = React.useCallback(() => {
    setFetchKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;

    if (!token) {
      setFavoriteIds(new Set());
      setFavoritesCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getJobListingFavoritesSummary(token)
      .then((summary) => {
        if (cancelled) return;
        setFavoriteIds(new Set(summary.ids));
        setFavoritesCount(summary.count);
      })
      .catch(() => {
        if (cancelled) return;
        setFavoriteIds(new Set());
        setFavoritesCount(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, fetchKey]);

  const syncFromListItems = React.useCallback((items: FavoriteListItem[]) => {
    if (items.length === 0) return;

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (item.is_favorited) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, []);

  const isFavorite = React.useCallback(
    (listingId: string) => favoriteIds.has(listingId),
    [favoriteIds],
  );

  const isToggling = React.useCallback(
    (listingId: string) => togglingIds.has(listingId),
    [togglingIds],
  );

  const toggleFavorite = React.useCallback(
    async (listingId: string) => {
      const token = session?.accessToken;
      if (!token || togglingIds.has(listingId)) return;

      const wasFavorite = favoriteIds.has(listingId);

      setTogglingIds((prev) => new Set(prev).add(listingId));
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      setFavoritesCount((count) => Math.max(0, count + (wasFavorite ? -1 : 1)));

      try {
        const result = wasFavorite
          ? await removeJobListingFavorite(token, listingId)
          : await addJobListingFavorite(token, listingId);

        setFavoritesCount(result.count);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (result.favorited) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        setFavoritesCount((count) => Math.max(0, count + (wasFavorite ? 1 : -1)));
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [favoriteIds, session?.accessToken, togglingIds],
  );

  const value = React.useMemo<JobFavoritesContextValue>(
    () => ({
      favoriteIds,
      favoritesCount,
      isLoading,
      isFavorite,
      isToggling,
      toggleFavorite,
      syncFromListItems,
      refreshFavorites,
    }),
    [
      favoriteIds,
      favoritesCount,
      isLoading,
      isFavorite,
      isToggling,
      toggleFavorite,
      syncFromListItems,
      refreshFavorites,
    ],
  );

  return (
    <JobFavoritesContext.Provider value={value}>
      {children}
    </JobFavoritesContext.Provider>
  );
}

export function useJobFavorites(): JobFavoritesContextValue {
  const context = React.useContext(JobFavoritesContext);
  if (!context) {
    throw new Error("useJobFavorites must be used within JobFavoritesProvider.");
  }
  return context;
}
