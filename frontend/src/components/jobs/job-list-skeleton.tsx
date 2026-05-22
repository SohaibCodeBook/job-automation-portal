export function JobListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="job-card-skeleton h-36 animate-pulse rounded-xl border border-border bg-muted/30"
        />
      ))}
    </div>
  );
}
