import { MapPin, Briefcase, Laptop } from "lucide-react";

import type { CountInsight } from "@/lib/dashboard-metrics";

type DashboardInsightsPanelProps = {
  topLocations: CountInsight[];
  topEmploymentTypes: CountInsight[];
  topWorkTypes: CountInsight[];
};

function InsightGroup({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CountInsight[];
}) {
  return (
    <div className="portal-dashboard-insight-group">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="portal-dashboard-insight-row">
              <span className="truncate text-sm">{item.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardInsightsPanel({
  topLocations,
  topEmploymentTypes,
  topWorkTypes,
}: DashboardInsightsPanelProps) {
  return (
    <section className="portal-dashboard-panel h-full" aria-label="Job insights">
      <div className="portal-dashboard-panel-header">
        <div>
          <h2 className="portal-dashboard-panel-title">Insights</h2>
          <p className="text-sm text-muted-foreground">
            Patterns from your latest scraped roles.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <InsightGroup title="Top locations" icon={MapPin} items={topLocations} />
        <InsightGroup
          title="Employment types"
          icon={Briefcase}
          items={topEmploymentTypes}
        />
        <InsightGroup title="Work types" icon={Laptop} items={topWorkTypes} />
      </div>
    </section>
  );
}
