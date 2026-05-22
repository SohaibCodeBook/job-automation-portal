"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Search,
  Send,
  Star,
} from "lucide-react";

import { JobCard } from "@/components/jobs/job-card";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { JobListEmpty } from "@/components/jobs/job-list-empty";
import { JobListError } from "@/components/jobs/job-list-error";
import { JobListSkeleton } from "@/components/jobs/job-list-skeleton";
import { PortalHeader } from "@/components/portal/portal-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { useJobListings } from "@/hooks/use-job-listings";
import {
  filterJobListings,
  formatSyncedLabel,
  isNewToday,
  uniqueValues,
} from "@/lib/jobs-display";
import { cn } from "@/lib/utils";

type JobTabId = "all" | "new_today";

const TABS: { id: JobTabId; label: string }[] = [
  { id: "all", label: "All Jobs" },
  { id: "new_today", label: "New Today" },
];

export function ScrappedJobsPage() {
  const { items, total, page, pageSize, isLoading, error, refetch, setPage } =
    useJobListings();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<JobTabId>("all");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState("");

  const latestCreated = React.useMemo(() => {
    let latest: string | null = null;
    for (const job of items) {
      if (!job.created_at) continue;
      if (!latest || job.created_at > latest) latest = job.created_at;
    }
    return latest;
  }, [items]);

  const newTodayCount = React.useMemo(
    () => items.filter((j) => isNewToday(j.created_at)).length,
    [items],
  );

  const filteredItems = React.useMemo(() => {
    let list = filterJobListings(items, searchQuery);
    if (activeTab === "new_today") {
      list = list.filter((j) => isNewToday(j.created_at));
    }
    if (typeFilter) {
      list = list.filter(
        (j) =>
          j.employment_type === typeFilter || j.work_type === typeFilter,
      );
    }
    if (locationFilter) {
      list = list.filter((j) => j.location === locationFilter);
    }
    return list;
  }, [items, searchQuery, activeTab, typeFilter, locationFilter]);

  const employmentTypes = React.useMemo(
    () => uniqueValues(items, "employment_type"),
    [items],
  );
  const workTypes = React.useMemo(() => uniqueValues(items, "work_type"), [items]);
  const locations = React.useMemo(() => uniqueValues(items, "location"), [items]);

  const typeOptions = React.useMemo(
    () => [...new Set([...employmentTypes, ...workTypes])],
    [employmentTypes, workTypes],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasDetail = selectedId != null;

  React.useEffect(() => {
    if (selectedId && !items.some((j) => j.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  return (
    <div className={cn("scrapped-jobs-layout", hasDetail && "scrapped-jobs-layout--split")}>
      <div className="scrapped-jobs-main">
        <PortalHeader
          title="Scrapped Jobs"
          subtitle={formatSyncedLabel(latestCreated)}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                asChild
              >
                <Link href={ROUTES.jobSpecs}>Edit Specs</Link>
              </Button>
              <Button size="sm" disabled className="portal-btn-primary">
                Re-Scrape
              </Button>
            </>
          }
        />

        <div className="portal-stat-grid">
          <div className="portal-stat-card" data-accent="blue">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total found
              </p>
              <Briefcase
                className="size-4 text-[var(--portal-accent)] opacity-90"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <p className="text-2xl font-bold tracking-tight">{total}</p>
            {newTodayCount > 0 ? (
              <p className="portal-stat-delta mt-1 text-xs">
                +{newTodayCount} new today
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">From your scrapes</p>
            )}
          </div>
          <div className="portal-stat-card" data-accent="green">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                On this page
              </p>
              <Star className="size-4 text-[var(--portal-accent)] opacity-90" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-2xl font-bold tracking-tight">{items.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Loaded results</p>
          </div>
          <div className="portal-stat-card" data-accent="orange">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Applied
              </p>
              <Send className="size-4 text-[var(--portal-accent)] opacity-90" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-2xl font-bold tracking-tight">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
          </div>
          <div className="portal-stat-card" data-accent="purple">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Avg. pay range
              </p>
              <DollarSign
                className="size-4 text-[var(--portal-accent)] opacity-90"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <p className="text-2xl font-bold tracking-tight">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Varies by listing</p>
          </div>
        </div>

        <div className="portal-search-row mb-4">
          <div className="portal-search-input flex-1">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              placeholder="Search by title, company, or keyword…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <select
            className="portal-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="portal-filter-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by location"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <nav className="portal-tabs" aria-label="Job filters">
          {TABS.map((tab) => {
            const count =
              tab.id === "all" ? total : newTodayCount;
            return (
              <button
                key={tab.id}
                type="button"
                className="portal-tab"
                data-active={activeTab === tab.id ? "true" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </nav>

        {isLoading ? <JobListSkeleton /> : null}
        {error && !isLoading ? (
          <JobListError message={error} onRetry={refetch} />
        ) : null}

        {!isLoading && !error && filteredItems.length === 0 ? (
          <JobListEmpty filtered={Boolean(searchQuery || typeFilter || locationFilter || activeTab !== "all")} />
        ) : null}

        {!isLoading && !error && filteredItems.length > 0 ? (
          <div className="job-list space-y-3">
            {filteredItems.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedId === job.id}
                onSelect={() => setSelectedId(job.id)}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      {hasDetail ? (
        <>
          <button
            type="button"
            className="job-detail-backdrop lg:hidden"
            aria-label="Close job details"
            onClick={() => setSelectedId(null)}
          />
          <JobDetailPanel
            listingId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        </>
      ) : null}
    </div>
  );
}
