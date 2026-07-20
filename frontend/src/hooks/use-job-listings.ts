"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import {
  getJobListingDateCounts,
  getJobListingFilterOptions,
  listJobListings,
} from "@/lib/api/job-listings";
import type {
  JobListingDateCounts,
  JobListingDateFilter,
  JobListingFilterOptions,
  JobListingListItem,
} from "@/types/job-listing";

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_DATE_COUNTS: JobListingDateCounts = {
  all: 0,
  today: 0,
  last_7_days: 0,
  last_2_weeks: 0,
  last_30_days: 0,
  older: 0,
};

const EMPTY_FILTER_OPTIONS: JobListingFilterOptions = {
  employment_types: [],
  work_types: [],
  locations: [],
};

type UseJobListingsOptions = {
  pageSize?: number;
  dateFilter?: JobListingDateFilter;
  listedOn?: string;
  favoritesOnly?: boolean;
  appliedOnly?: boolean;
  archivedOnly?: boolean;
  searchQuery?: string;
  typeFilter?: string;
  locationFilter?: string;
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
  filterOptions: JobListingFilterOptions;
  filterOptionsLoading: boolean;
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
  const archivedOnly = options.archivedOnly ?? false;
  const searchQuery = options.searchQuery ?? "";
  const typeFilter = options.typeFilter ?? "";
  const locationFilter = options.locationFilter ?? "";

  const { data: session, status: sessionStatus } = useSession();
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<JobListingListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dateCounts, setDateCounts] =
    React.useState<JobListingDateCounts>(EMPTY_DATE_COUNTS);
  const [dateCountsLoading, setDateCountsLoading] = React.useState(true);
  const [filterOptions, setFilterOptions] =
    React.useState<JobListingFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [filterOptionsLoading, setFilterOptionsLoading] = React.useState(true);
  const [fetchKey, setFetchKey] = React.useState(0);
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery);

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
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    setPage(1);
  }, [
    dateFilter,
    listedOn,
    favoritesOnly,
    appliedOnly,
    archivedOnly,
    debouncedSearch,
    typeFilter,
    locationFilter,
  ]);

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
      setFilterOptionsLoading(false);
      setFilterOptions(EMPTY_FILTER_OPTIONS);
      return;
    }

    if (dateFilter === "on_date" && !listedOn) {
      setFilterOptionsLoading(false);
      setFilterOptions(EMPTY_FILTER_OPTIONS);
      return;
    }

    let cancelled = false;
    setFilterOptionsLoading(true);

    getJobListingFilterOptions(token, {
      dateFilter,
      listedOn,
      favoritesOnly,
      appliedOnly,
      archivedOnly,
    })
      .then((options) => {
        if (!cancelled) setFilterOptions(options);
      })
      .catch(() => {
        if (!cancelled) setFilterOptions(EMPTY_FILTER_OPTIONS);
      })
      .finally(() => {
        if (!cancelled) setFilterOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    sessionStatus,
    dateFilter,
    listedOn,
    favoritesOnly,
    appliedOnly,
    archivedOnly,
    fetchKey,
  ]);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;
    if (!token) {
      setIsLoading(false);
      setError("Sign in to view discovered jobs.");
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
      archivedOnly,
      search: debouncedSearch,
      typeFilter,
      location: locationFilter,
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
    archivedOnly,
    debouncedSearch,
    typeFilter,
    locationFilter,
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
    filterOptions,
    filterOptionsLoading,
    refetch,
    setPage,
    updateItemNote,
  };
}
