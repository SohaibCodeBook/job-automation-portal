export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="portal-dashboard-top-grid">
        <div className="portal-dashboard-panel h-[22rem] animate-pulse bg-muted/20" />
        <div className="portal-dashboard-panel h-[22rem] animate-pulse bg-muted/20" />
      </div>
      <div className="portal-dashboard-grid">
        <div className="portal-dashboard-panel h-80 animate-pulse bg-muted/20" />
        <div className="portal-dashboard-panel h-80 animate-pulse bg-muted/20" />
      </div>
    </div>
  );
}
