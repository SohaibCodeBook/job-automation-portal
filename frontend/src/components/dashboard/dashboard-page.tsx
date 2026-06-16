"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { DashboardInsightsPanel } from "@/components/dashboard/dashboard-insights-panel";
import { DashboardPipeline } from "@/components/dashboard/dashboard-pipeline";
import { DashboardRecentActivity } from "@/components/dashboard/dashboard-recent-activity";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardWeeklyChart } from "@/components/dashboard/dashboard-weekly-chart";
import { PortalHeader } from "@/components/portal/portal-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  displayName,
  greetingForHour,
} from "@/lib/dashboard-metrics";
import { formatSyncedLabel } from "@/lib/jobs-display";

export function DashboardPage() {
  const { data: session } = useSession();
  const {
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
  } = useDashboardData();

  const name = displayName(
    session?.user?.name,
    latestApplication?.first_name,
  );
  const greeting = greetingForHour();
  const subtitleParts = [
    name ? `${greeting}, ${name}` : greeting,
    formatSyncedLabel(latestCreated),
  ].filter((part) => part && part !== "Last synced —");

  const headerSubtitle =
    subtitleParts.length > 0
      ? subtitleParts.join(" · ")
      : "Your AI job search command center";

  return (
    <>
      <PortalHeader
        title="Dashboard"
        subtitle={headerSubtitle}
        actions={
          <>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href={ROUTES.scrappedJobs}>View Jobs</Link>
            </Button>
            <Button size="sm" className="portal-btn-primary" asChild>
              <Link href={ROUTES.jobSpecs}>Edit Specs</Link>
            </Button>
          </>
        }
      />

      {isLoading ? <DashboardSkeleton /> : null}

      {error && !isLoading ? (
        <div className="portal-empty-panel">
          <p className="font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={refetch}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-6">
          <div className="portal-dashboard-top-grid">
            <DashboardWeeklyChart days={weeklyChart} />
            <DashboardPipeline pipeline={pipeline} />
          </div>

          <div className="portal-dashboard-grid">
            <DashboardRecentActivity items={activity} />
            <DashboardInsightsPanel
              topLocations={topLocations}
              topEmploymentTypes={topEmploymentTypes}
              topWorkTypes={topWorkTypes}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
