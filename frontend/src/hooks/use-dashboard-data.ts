"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { useJobApplied } from "@/hooks/use-job-applied";
import { useJobFavorites } from "@/hooks/use-job-favorites";
import { listJobApplications } from "@/lib/api/job-applications";
import { getJobListingDateCounts } from "@/lib/api/job-listings";
import { fetchAllJobListings } from "@/lib/fetch-all-listings";
import {
  buildLast7DayChart,
  buildRecentActivity,
  computePipelineMetrics,
  topFieldCounts,
  type ActivityItem,
  type CountInsight,
  type PipelineMetrics,
  type WeeklyChartDay,
} from "@/lib/dashboard-metrics";
import type { JobApplicationListItem } from "@/lib/api/job-applications";
import type { JobListingDateCounts, JobListingListItem } from "@/types/job-listing";

const EMPTY_DATE_COUNTS: JobListingDateCounts = {
  all: 0,
  today: 0,
  last_7_days: 0,
  last_2_weeks: 0,
  last_30_days: 0,
  older: 0,
};

export type DashboardData = {
  dateCounts: JobListingDateCounts;
  pipeline: PipelineMetrics;
  weeklyChart: WeeklyChartDay[];
  activity: ActivityItem[];
  topLocations: CountInsight[];
  topEmploymentTypes: CountInsight[];
  topWorkTypes: CountInsight[];
  latestApplication: JobApplicationListItem | null;
  latestCreated: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useDashboardData(): DashboardData {
  const { data: session, status: sessionStatus } = useSession();
  const { favoritesCount } = useJobFavorites();
  const { appliedCount } = useJobApplied();

  const [dateCounts, setDateCounts] =
    React.useState<JobListingDateCounts>(EMPTY_DATE_COUNTS);
  const [weeklyJobs, setWeeklyJobs] = React.useState<JobListingListItem[]>([]);
  const [appliedJobs, setAppliedJobs] = React.useState<JobListingListItem[]>([]);
  const [insightJobs, setInsightJobs] = React.useState<JobListingListItem[]>([]);
  const [latestApplication, setLatestApplication] =
    React.useState<JobApplicationListItem | null>(null);
  const [latestCreated, setLatestCreated] = React.useState<string | null>(null);
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
      setIsLoading(false);
      setError("Sign in to view your dashboard.");
      setDateCounts(EMPTY_DATE_COUNTS);
      setWeeklyJobs([]);
      setAppliedJobs([]);
      setInsightJobs([]);
      setLatestApplication(null);
      setLatestCreated(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getJobListingDateCounts(token),
      fetchAllJobListings(token, { dateFilter: "last_7_days" }),
      fetchAllJobListings(token, { appliedOnly: true }),
      fetchAllJobListings(token, { pageSize: 50 }),
      listJobApplications(token, { page: 1, pageSize: 1 }),
    ])
      .then(([counts, weekListings, appliedListings, insights, applications]) => {
        if (cancelled) return;
        setDateCounts(counts);
        setWeeklyJobs(weekListings);
        setAppliedJobs(appliedListings);
        setInsightJobs(insights);
        setLatestApplication(applications.items[0] ?? null);

        let latest: string | null = null;
        for (const job of weekListings) {
          if (!job.created_at) continue;
          if (!latest || job.created_at > latest) latest = job.created_at;
        }
        setLatestCreated(latest);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        setDateCounts(EMPTY_DATE_COUNTS);
        setWeeklyJobs([]);
        setAppliedJobs([]);
        setInsightJobs([]);
        setLatestApplication(null);
        setLatestCreated(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, fetchKey]);

  const pipeline = React.useMemo(
    () => computePipelineMetrics(dateCounts.all, favoritesCount, appliedCount),
    [dateCounts.all, favoritesCount, appliedCount],
  );

  const weeklyChart = React.useMemo(
    () => buildLast7DayChart(weeklyJobs, appliedJobs),
    [weeklyJobs, appliedJobs],
  );

  const activity = React.useMemo(
    () =>
      buildRecentActivity(
        dateCounts.today,
        latestCreated,
        appliedJobs,
        insightJobs.slice(0, 8),
      ),
    [dateCounts.today, latestCreated, appliedJobs, insightJobs],
  );

  const topLocations = React.useMemo(
    () => topFieldCounts(insightJobs, "location"),
    [insightJobs],
  );
  const topEmploymentTypes = React.useMemo(
    () => topFieldCounts(insightJobs, "employment_type"),
    [insightJobs],
  );
  const topWorkTypes = React.useMemo(
    () => topFieldCounts(insightJobs, "work_type"),
    [insightJobs],
  );

  return {
    dateCounts,
    pipeline,
    weeklyChart,
    activity,
    topLocations,
    topEmploymentTypes,
    topWorkTypes,
    latestApplication,
    latestCreated,
    isLoading,
    error,
    refetch,
  };
}
