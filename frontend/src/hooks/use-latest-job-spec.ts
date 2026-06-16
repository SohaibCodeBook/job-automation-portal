"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import {
  getJobApplication,
  listJobApplications,
  type JobApplicationDetail,
} from "@/lib/api/job-applications";

export type LatestJobSpecState = {
  spec: JobApplicationDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useLatestJobSpec(): LatestJobSpecState {
  const { data: session, status: sessionStatus } = useSession();
  const [spec, setSpec] = React.useState<JobApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    setFetchKey((key) => key + 1);
  }, []);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (sessionStatus === "loading") return;

    if (!token) {
      setSpec(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listJobApplications(token, { page: 1, pageSize: 1 })
      .then(async (list) => {
        if (cancelled) return;
        const latest = list.items[0];
        if (!latest) {
          setSpec(null);
          return;
        }
        const detail = await getJobApplication(token, latest.id);
        if (!cancelled) setSpec(detail);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSpec(null);
        setError(err instanceof Error ? err.message : "Failed to load job spec.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, fetchKey]);

  return { spec, isLoading, error, refetch };
}
