"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { listJobListings } from "@/lib/api/job-listings";
import type { JobListingListItem } from "@/types/job-listing";

const DEFAULT_PAGE_SIZE = 20;

type UseJobListingsResult = {
  items: JobListingListItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
};

export function useJobListings(
  pageSize: number = DEFAULT_PAGE_SIZE,
): UseJobListingsResult {
  const { data: session, status: sessionStatus } = useSession();
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<JobListingListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

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

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listJobListings(token, { page, pageSize })
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
  }, [session?.accessToken, sessionStatus, page, pageSize, fetchKey]);

  return {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error,
    refetch,
    setPage,
  };
}
