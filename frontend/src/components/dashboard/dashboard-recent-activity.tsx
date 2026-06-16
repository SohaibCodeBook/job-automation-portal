import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Sparkles } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { ActivityItem } from "@/lib/dashboard-metrics";
import { formatActivityTime } from "@/lib/dashboard-metrics";

type DashboardRecentActivityProps = {
  items: ActivityItem[];
};

const ICONS = {
  scrape: Sparkles,
  applied: CheckCircle2,
  match: Briefcase,
} as const;

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
  return (
    <section className="portal-dashboard-panel h-full" aria-label="Recent activity">
      <div className="portal-dashboard-panel-header">
        <div>
          <h2 className="portal-dashboard-panel-title">Recent activity</h2>
          <p className="text-sm text-muted-foreground">
            Latest scrapes, matches, and applications.
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

      {items.length === 0 ? (
        <div className="portal-empty-panel py-8">
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run a scrape or mark jobs as applied to see updates here.
          </p>
        </div>
      ) : (
        <ul className="portal-dashboard-activity-list">
          {items.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <li key={item.id} className="portal-dashboard-activity-item">
                <span
                  className="portal-dashboard-activity-icon"
                  data-type={item.type}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>
                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  dateTime={item.at}
                >
                  {formatActivityTime(item.at)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
