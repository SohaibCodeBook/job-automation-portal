import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { PipelineMetrics } from "@/lib/dashboard-metrics";

type DashboardPipelineProps = {
  pipeline: PipelineMetrics;
};

const STAGES = [
  { key: "total" as const, label: "Scraped", accent: "purple" },
  { key: "saved" as const, label: "Saved", accent: "blue" },
  { key: "applied" as const, label: "Applied", accent: "teal" },
  { key: "responded" as const, label: "Responded", accent: "orange" },
  { key: "interview" as const, label: "Interview", accent: "rose" },
];

export function DashboardPipeline({ pipeline }: DashboardPipelineProps) {
  const values = {
    total: pipeline.total,
    saved: pipeline.saved,
    applied: pipeline.applied,
    responded: pipeline.responded,
    interview: pipeline.interview,
  };

  const max = Math.max(pipeline.total, 1);

  return (
    <section
      className="portal-dashboard-panel portal-dashboard-panel--pipeline"
      aria-label="Application pipeline"
    >
      <div className="portal-dashboard-panel-header">
        <h2 className="portal-dashboard-panel-title">Application pipeline</h2>
      </div>

      <ul className="portal-dashboard-pipeline-list">
        {STAGES.map((stage) => {
          const count = values[stage.key];
          const width = Math.max(count > 0 ? 10 : 0, Math.round((count / max) * 100));
          const isFuture = stage.key === "responded" || stage.key === "interview";

          return (
            <li key={stage.key} className="portal-dashboard-pipeline-row">
              <div className="portal-dashboard-pipeline-row-head">
                <span className="text-sm text-muted-foreground">{stage.label}</span>
                <span className="text-sm font-semibold tabular-nums">{count}</span>
              </div>
              <div className="portal-dashboard-pipeline-track" aria-hidden>
                <div
                  className="portal-dashboard-pipeline-fill"
                  data-accent={stage.accent}
                  data-muted={isFuture && count === 0 ? "true" : undefined}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="portal-dashboard-conversion">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversion rate
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {pipeline.conversionRate}%
        </p>
        <p className="text-sm text-muted-foreground">scraped → applied</p>
      </div>

      <Link
        href={`${ROUTES.scrappedJobs}?view=applied`}
        className="portal-dashboard-text-link mt-4 inline-flex items-center gap-1 text-sm"
      >
        View applied jobs
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
