import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import {
  companyInitials,
  formatListingCreatedAt,
} from "@/lib/jobs-display";
import type { JobListingListItem } from "@/types/job-listing";

type DashboardRecentJobsProps = {
  jobs: JobListingListItem[];
};

export function DashboardRecentJobs({ jobs }: DashboardRecentJobsProps) {
  return (
    <section className="portal-dashboard-panel h-full" aria-label="Recent jobs">
      <div className="portal-dashboard-panel-header">
        <div>
          <h2 className="portal-dashboard-panel-title">Recent jobs</h2>
          <p className="text-sm text-muted-foreground">
            Latest roles from your most recent scrape.
          </p>
        </div>
        <Link
          href={ROUTES.scrappedJobs}
          className="portal-dashboard-text-link inline-flex items-center gap-1 text-sm"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="portal-empty-panel py-8">
          <p className="text-sm font-medium">No jobs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete Job Specs and run a scrape to see listings here.
          </p>
          <Link href={ROUTES.jobSpecs} className="portal-dashboard-text-link mt-3 inline-block text-sm">
            Set up Job Specs
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={ROUTES.scrappedJobs}
                className="portal-dashboard-job-row"
              >
                <span className="portal-dashboard-job-logo" aria-hidden>
                  {companyInitials(job.company)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {job.title ?? "Untitled role"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[job.company, job.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatListingCreatedAt(job.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
