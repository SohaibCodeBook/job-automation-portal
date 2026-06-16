"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { WeeklyChartDay } from "@/lib/dashboard-metrics";

type DashboardWeeklyChartProps = {
  days: WeeklyChartDay[];
};

export function DashboardWeeklyChart({ days }: DashboardWeeklyChartProps) {
  const maxValue = Math.max(
    1,
    ...days.flatMap((day) => [day.scraped, day.applied]),
  );

  return (
    <section
      className="portal-dashboard-panel portal-dashboard-panel--chart"
      aria-label="Jobs scraped vs applied"
    >
      <div className="portal-dashboard-panel-header">
        <div>
          <h2 className="portal-dashboard-panel-title">
            Jobs scraped vs applied
          </h2>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        <Link
          href={ROUTES.scrappedJobs}
          className="portal-dashboard-text-link inline-flex items-center gap-1 text-sm"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="portal-dashboard-chart" role="img" aria-label="Weekly bar chart">
        {days.map((day) => (
          <div key={day.key} className="portal-dashboard-chart-day">
            <div className="portal-dashboard-chart-bars">
              <div
                className="portal-dashboard-chart-bar portal-dashboard-chart-bar--scraped"
                style={{ height: `${Math.max(6, (day.scraped / maxValue) * 100)}%` }}
                title={`${day.scraped} scraped`}
              />
              <div
                className="portal-dashboard-chart-bar portal-dashboard-chart-bar--applied"
                style={{ height: `${Math.max(6, (day.applied / maxValue) * 100)}%` }}
                title={`${day.applied} applied`}
              />
            </div>
            <span className="portal-dashboard-chart-label">{day.label}</span>
          </div>
        ))}
      </div>

      <div className="portal-dashboard-chart-legend">
        <span className="portal-dashboard-chart-legend-item">
          <span className="portal-dashboard-chart-swatch portal-dashboard-chart-swatch--scraped" />
          Scraped
        </span>
        <span className="portal-dashboard-chart-legend-item">
          <span className="portal-dashboard-chart-swatch portal-dashboard-chart-swatch--applied" />
          Applied
        </span>
      </div>
    </section>
  );
}
