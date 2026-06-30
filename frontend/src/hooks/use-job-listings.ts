"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import {
  getJobListingDateCounts,
  listJobListings,
} from "@/lib/api/job-listings";
import type {
  JobListingDateCounts,
  JobListingDateFilter,
  JobListingListItem,
} from "@/types/job-listing";

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_DATE_COUNTS: JobListingDateCounts = {
  all: 0,
  today: 0,
  last_7_days: 0,
  last_2_weeks: 0,
  last_30_days: 0,
  older: 0,
};

type UseJobListingsOptions = {
  pageSize?: number;
  dateFilter?: JobListingDateFilter;
  listedOn?: string;
  favoritesOnly?: boolean;
  appliedOnly?: boolean;
};

type UseJobListingsResult = {
  items: JobListingListItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  dateCounts: JobListingDateCounts;
  dateCountsLoading: boolean;
  refetch: () => void;
  setPage: (page: number) => void;
  updateItemNote: (
    listingId: string,
    note: string | null,
    noteUpdatedAt: string | null,
  ) => void;
};

export function useJobListings(
  options: UseJobListingsOptions = {},
): UseJobListingsResult {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const dateFilter = options.dateFilter ?? "all";
  const listedOn = options.listedOn;
  const favoritesOnly = options.favoritesOnly ?? false;
  const appliedOnly = options.appliedOnly ?? false;

  const { data: session, status: sessionStatus } = useSession();
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<JobListingListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dateCounts, setDateCounts] =
    React.useState<JobListingDateCounts>(EMPTY_DATE_COUNTS);
  const [dateCountsLoading, setDateCountsLoading] = React.useState(true);
  const [fetchKey, setFetchKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  const updateItemNote = React.useCallback(
    (
      listingId: string,
      note: string | null,
      noteUpdatedAt: string | null,
    ) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? { ...item, note, note_updated_at: noteUpdatedAt }
            : item,
        ),
      );
    },
    [],
  );

  React.useEffect(() => {
    setPage(1);
  }, [dateFilter, listedOn, favoritesOnly, appliedOnly]);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;
    if (!token) {
      setDateCountsLoading(false);
      setDateCounts(EMPTY_DATE_COUNTS);
      return;
    }

    let cancelled = false;
    setDateCountsLoading(true);

    getJobListingDateCounts(token)
      .then((counts) => {
        if (!cancelled) setDateCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setDateCounts(EMPTY_DATE_COUNTS);
      })
      .finally(() => {
        if (!cancelled) setDateCountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, fetchKey]);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;
    if (!token) {
      setIsLoading(false);
      setError("Sign in to view scrapped jobs.");
      setItems([]);
      setTotal(0);
      return;
    }

    if (dateFilter === "on_date" && !listedOn) {
      setIsLoading(false);
      setError(null);
      setItems([]);
      setTotal(0);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listJobListings(token, {
      page,
      pageSize,
      dateFilter,
      listedOn,
      favoritesOnly,
      appliedOnly,
    })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load jobs.");
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    sessionStatus,
    page,
    pageSize,
    dateFilter,
    listedOn,
    favoritesOnly,
    appliedOnly,
    fetchKey,
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error,
    dateCounts,
    dateCountsLoading,
    refetch,
    setPage,
    updateItemNote,
  };
}
