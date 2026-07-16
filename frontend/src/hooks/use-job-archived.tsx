"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import {
  archiveJobListing,
  bulkArchiveJobListings,
  getJobListingArchivesSummary,
  unarchiveJobListing,
} from "@/lib/api/job-listings";

type ArchivedListItem = {
  id: string;
  is_archived?: boolean;
};

export type JobArchivedContextValue = {
  archivedIds: ReadonlySet<string>;
  archivedCount: number;
  isLoading: boolean;
  isArchived: (listingId: string) => boolean;
  isUpdating: (listingId: string) => boolean;
  archive: (listingId: string) => Promise<void>;
  unarchive: (listingId: string) => Promise<void>;
  bulkArchive: (listingIds: string[], archived: boolean) => Promise<void>;
  syncFromListItems: (items: ArchivedListItem[]) => void;
  refreshArchived: () => void;
};

const JobArchivedContext = React.createContext<JobArchivedContextValue | null>(
  null,
);

export function JobArchivedProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [archivedCount, setArchivedCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [fetchKey, setFetchKey] = React.useState(0);

  const refreshArchived = React.useCallback(() => {
    setFetchKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;

    if (!token) {
      setArchivedIds(new Set());
      setArchivedCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getJobListingArchivesSummary(token)
      .then((summary) => {
        if (cancelled) return;
        setArchivedIds(new Set(summary.ids));
        setArchivedCount(summary.count);
      })
      .catch(() => {
        if (cancelled) return;
        setArchivedIds(new Set());
        setArchivedCount(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, fetchKey]);

  const syncFromListItems = React.useCallback((items: ArchivedListItem[]) => {
    if (items.length === 0) return;

    setArchivedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (item.is_archived) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, []);

  const isArchived = React.useCallback(
    (listingId: string) => archivedIds.has(listingId),
    [archivedIds],
  );

  const isUpdating = React.useCallback(
    (listingId: string) => updatingIds.has(listingId),
    [updatingIds],
  );

  const archive = React.useCallback(
    async (listingId: string) => {
      const token = session?.accessToken;
      if (!token || updatingIds.has(listingId) || archivedIds.has(listingId)) {
        return;
      }

      setUpdatingIds((prev) => new Set(prev).add(listingId));
      setArchivedIds((prev) => new Set(prev).add(listingId));
      setArchivedCount((count) => count + 1);

      try {
        const result = await archiveJobListing(token, listingId);
        setArchivedCount(result.count);
        setArchivedIds((prev) => {
          const next = new Set(prev);
          if (result.archived) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      } catch {
        setArchivedIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
        setArchivedCount((count) => Math.max(0, count - 1));
        throw new Error("Unable to archive job.");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [archivedIds, session?.accessToken, updatingIds],
  );

  const unarchive = React.useCallback(
    async (listingId: string) => {
      const token = session?.accessToken;
      if (!token || updatingIds.has(listingId) || !archivedIds.has(listingId)) {
        return;
      }

      setUpdatingIds((prev) => new Set(prev).add(listingId));
      setArchivedIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
      setArchivedCount((count) => Math.max(0, count - 1));

      try {
        const result = await unarchiveJobListing(token, listingId);
        setArchivedCount(result.count);
        setArchivedIds((prev) => {
          const next = new Set(prev);
          if (result.archived) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      } catch {
        setArchivedIds((prev) => new Set(prev).add(listingId));
        setArchivedCount((count) => count + 1);
        throw new Error("Unable to unarchive job.");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [archivedIds, session?.accessToken, updatingIds],
  );

  const bulkArchive = React.useCallback(
    async (listingIds: string[], archived: boolean) => {
      const token = session?.accessToken;
      if (!token || listingIds.length === 0) return;

      const uniqueIds = [...new Set(listingIds)];
      const idsToUpdate = uniqueIds.filter((id) =>
        archived ? !archivedIds.has(id) : archivedIds.has(id),
      );
      if (idsToUpdate.length === 0) return;

      setUpdatingIds((prev) => {
        const next = new Set(prev);
        for (const id of idsToUpdate) next.add(id);
        return next;
      });
      setArchivedIds((prev) => {
        const next = new Set(prev);
        for (const id of idsToUpdate) {
          if (archived) next.add(id);
          else next.delete(id);
        }
        return next;
      });
      setArchivedCount((count) =>
        Math.max(0, count + (archived ? idsToUpdate.length : -idsToUpdate.length)),
      );

      try {
        const result = await bulkArchiveJobListings(token, {
          listing_ids: idsToUpdate,
          archived,
        });
        setArchivedCount(result.count);
        setArchivedIds((prev) => {
          const next = new Set(prev);
          for (const id of idsToUpdate) {
            if (result.archived) next.add(id);
            else next.delete(id);
          }
          return next;
        });
      } catch {
        setArchivedIds((prev) => {
          const next = new Set(prev);
          for (const id of idsToUpdate) {
            if (archived) next.delete(id);
            else next.add(id);
          }
          return next;
        });
        setArchivedCount((count) =>
          Math.max(
            0,
            count + (archived ? -idsToUpdate.length : idsToUpdate.length),
          ),
        );
        throw new Error(
          archived
            ? "Unable to archive selected jobs."
            : "Unable to unarchive selected jobs.",
        );
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          for (const id of idsToUpdate) next.delete(id);
          return next;
        });
      }
    },
    [archivedIds, session?.accessToken],
  );

  const value = React.useMemo<JobArchivedContextValue>(
    () => ({
      archivedIds,
      archivedCount,
      isLoading,
      isArchived,
      isUpdating,
      archive,
      unarchive,
      bulkArchive,
      syncFromListItems,
      refreshArchived,
    }),
    [
      archivedIds,
      archivedCount,
      isLoading,
      isArchived,
      isUpdating,
      archive,
      unarchive,
      bulkArchive,
      syncFromListItems,
      refreshArchived,
    ],
  );

  return (
    <JobArchivedContext.Provider value={value}>
      {children}
    </JobArchivedContext.Provider>
  );
}

export function useJobArchived(): JobArchivedContextValue {
  const context = React.useContext(JobArchivedContext);
  if (!context) {
    throw new Error("useJobArchived must be used within JobArchivedProvider.");
  }
  return context;
}
