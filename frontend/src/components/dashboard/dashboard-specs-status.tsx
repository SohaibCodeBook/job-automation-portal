import Link from "next/link";
import { CheckCircle2, SlidersHorizontal } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { JobApplicationListItem } from "@/lib/api/job-applications";
import { formatListingCreatedAtAbsolute } from "@/lib/jobs-display";

type DashboardSpecsStatusProps = {
  application: JobApplicationListItem | null;
};

function workModeLabel(application: JobApplicationListItem): string {
  const modes = [
    application.remote ? "Remote" : null,
    application.hybrid ? "Hybrid" : null,
    application.onsite ? "On-site" : null,
  ].filter(Boolean);
  return modes.length > 0 ? modes.join(", ") : "Not set";
}

export function DashboardSpecsStatus({ application }: DashboardSpecsStatusProps) {
  const hasSpecs = application != null;

  return (
    <section className="portal-dashboard-panel" aria-label="Job specs status">
      <div className="portal-dashboard-panel-header">
        <div className="flex items-start gap-3">
          <span className="portal-dashboard-spec-icon" aria-hidden>
            <SlidersHorizontal className="size-4" />
          </span>
          <div>
            <h2 className="portal-dashboard-panel-title">Job Specs</h2>
            <p className="text-sm text-muted-foreground">
              {hasSpecs
                ? "Your search preferences are saved and ready for scraping."
                : "Define preferences so AI can find matching roles."}
            </p>
          </div>
        </div>
        {hasSpecs ? (
          <span className="portal-status-badge portal-status-badge--complete">
            <span className="portal-status-badge-dot" aria-hidden />
            Configured
          </span>
        ) : (
          <span className="portal-status-badge portal-status-badge--pending">
            <span className="portal-status-badge-dot" aria-hidden />
            Pending
          </span>
        )}
      </div>

      {hasSpecs ? (
        <div className="portal-dashboard-spec-grid">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Target titles
            </p>
            <p className="mt-1 text-sm font-medium">
              {application.desired_job_title_1?.trim() || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Work mode
            </p>
            <p className="mt-1 text-sm font-medium">{workModeLabel(application)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Employment type
            </p>
            <p className="mt-1 text-sm font-medium">
              {application.job_type?.trim() || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last saved
            </p>
            <p
              className="mt-1 text-sm font-medium"
              title={formatListingCreatedAtAbsolute(application.created_at)}
            >
              {application.created_at
                ? formatListingCreatedAtAbsolute(application.created_at)
                : "—"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 opacity-70" aria-hidden />
          <p>
            Complete personal info, industries, work preferences, and target titles
            to start scraping jobs.
          </p>
        </div>
      )}

      <div className="mt-4">
        <Link href={ROUTES.jobSpecs} className="portal-dashboard-text-link text-sm font-medium">
          {hasSpecs ? "Edit Job Specs" : "Complete Job Specs"} →
        </Link>
      </div>
    </section>
  );
}
