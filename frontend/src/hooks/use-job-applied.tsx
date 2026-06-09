"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import {
  getJobListingAppliedSummary,
  markJobListingApplied,
  unmarkJobListingApplied,
} from "@/lib/api/job-listings";

type AppliedListItem = {
  id: string;
  is_applied?: boolean;
};

export type JobAppliedContextValue = {
  appliedIds: ReadonlySet<string>;
  appliedCount: number;
  isLoading: boolean;
  isApplied: (listingId: string) => boolean;
  isUpdating: (listingId: string) => boolean;
  markApplied: (listingId: string) => Promise<void>;
  unmarkApplied: (listingId: string) => Promise<void>;
  syncFromListItems: (items: AppliedListItem[]) => void;
  refreshApplied: () => void;
};

const JobAppliedContext = React.createContext<JobAppliedContextValue | null>(
  null,
);

export function JobAppliedProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(() => new Set());
  const [appliedCount, setAppliedCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(() => new Set());
  const [fetchKey, setFetchKey] = React.useState(0);

  const refreshApplied = React.useCallback(() => {
    setFetchKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;

    if (!token) {
      setAppliedIds(new Set());
      setAppliedCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getJobListingAppliedSummary(token)
      .then((summary) => {
        if (cancelled) return;
        setAppliedIds(new Set(summary.ids));
        setAppliedCount(summary.count);
      })
      .catch(() => {
        if (cancelled) return;
        setAppliedIds(new Set());
        setAppliedCount(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, fetchKey]);

  const syncFromListItems = React.useCallback((items: AppliedListItem[]) => {
    if (items.length === 0) return;

    setAppliedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (item.is_applied) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, []);

  const isApplied = React.useCallback(
    (listingId: string) => appliedIds.has(listingId),
    [appliedIds],
  );

  const isUpdating = React.useCallback(
    (listingId: string) => updatingIds.has(listingId),
    [updatingIds],
  );

  const markApplied = React.useCallback(
    async (listingId: string) => {
      const token = session?.accessToken;
      if (!token || updatingIds.has(listingId) || appliedIds.has(listingId)) {
        return;
      }

      setUpdatingIds((prev) => new Set(prev).add(listingId));
      setAppliedIds((prev) => new Set(prev).add(listingId));
      setAppliedCount((count) => count + 1);

      try {
        const result = await markJobListingApplied(token, listingId);
        setAppliedCount(result.count);
        setAppliedIds((prev) => {
          const next = new Set(prev);
          if (result.applied) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      } catch {
        setAppliedIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
        setAppliedCount((count) => Math.max(0, count - 1));
        throw new Error("Unable to mark job as applied.");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [appliedIds, session?.accessToken, updatingIds],
  );

  const unmarkApplied = React.useCallback(
    async (listingId: string) => {
      const token = session?.accessToken;
      if (!token || updatingIds.has(listingId) || !appliedIds.has(listingId)) {
        return;
      }

      setUpdatingIds((prev) => new Set(prev).add(listingId));
      setAppliedIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
      setAppliedCount((count) => Math.max(0, count - 1));

      try {
        const result = await unmarkJobListingApplied(token, listingId);
        setAppliedCount(result.count);
        setAppliedIds((prev) => {
          const next = new Set(prev);
          if (result.applied) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      } catch {
        setAppliedIds((prev) => new Set(prev).add(listingId));
        setAppliedCount((count) => count + 1);
        throw new Error("Unable to undo applied status.");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [appliedIds, session?.accessToken, updatingIds],
  );

  const value = React.useMemo<JobAppliedContextValue>(
    () => ({
      appliedIds,
      appliedCount,
      isLoading,
      isApplied,
      isUpdating,
      markApplied,
      unmarkApplied,
      syncFromListItems,
      refreshApplied,
    }),
    [
      appliedIds,
      appliedCount,
      isLoading,
      isApplied,
      isUpdating,
      markApplied,
      unmarkApplied,
      syncFromListItems,
      refreshApplied,
    ],
  );

  return (
    <JobAppliedContext.Provider value={value}>
      {children}
    </JobAppliedContext.Provider>
  );
}

export function useJobApplied(): JobAppliedContextValue {
  const context = React.useContext(JobAppliedContext);
  if (!context) {
    throw new Error("useJobApplied must be used within JobAppliedProvider.");
  }
  return context;
}
