import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  Send,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

const PLACEHOLDER_STATS = [
  {
    label: "Total found",
    value: "—",
    hint: "Connect listings API",
    icon: Briefcase,
  },
  {
    label: "Strong matches",
    value: "—",
    hint: "AI match scores",
    icon: Star,
  },
  {
    label: "Applied",
    value: "—",
    hint: "This session",
    icon: Send,
  },
  {
    label: "Avg. pay range",
    value: "—",
    hint: "From your spec",
    icon: DollarSign,
  },
] as const;

export function ScrappedJobsPlaceholder() {
  return (
    <>
      <PortalHeader
        title="Discovered Jobs",
        subtitle="Last synced — waiting for job listings"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.jobSpecs}>Edit Specs</Link>
            </Button>
            <Button size="sm" disabled className="portal-btn-primary">
              Re-Scrape
            </Button>
          </>
        }
      />

      <div className="portal-stat-grid">
        {PLACEHOLDER_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="portal-stat-card">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <Icon
                  className="size-4 text-[var(--portal-accent)] opacity-80"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3 opacity-60" aria-hidden />
                {stat.hint}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mb-4 rounded-xl border border-border bg-[var(--portal-card-elevated)] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Active search spec</p>
          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link href={ROUTES.jobSpecs}>Edit</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Save your{" "}
          <Link
            href={ROUTES.jobSpecs}
            className="font-medium text-[var(--portal-accent)] underline-offset-2 hover:underline"
          >
            Job Specs
          </Link>{" "}
          to enable scraping. Job cards will appear here once listings are synced from
          the database.
        </p>
      </div>

      <div className="portal-empty-panel">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--portal-accent-muted)]">
          <Sparkles
            className="size-7 text-[var(--portal-accent)]"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <h2 className="text-lg font-semibold">No discovered jobs yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          This page will list roles matched to your preferences. Complete Job Specs,
          run a scrape, and your results will show up here with filters and match
          scores.
        </p>
        <Button className="portal-btn-primary mt-6" asChild>
          <Link href={ROUTES.jobSpecs}>Set up Job Specs</Link>
        </Button>
      </div>
    </>
  );
}
