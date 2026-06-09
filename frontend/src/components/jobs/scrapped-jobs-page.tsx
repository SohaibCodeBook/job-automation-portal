"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Heart,
  Search,
  Send,
} from "lucide-react";

import { useSession } from "next-auth/react";

import { JobCard } from "@/components/jobs/job-card";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { JobExportCsvButton } from "@/components/jobs/job-export-csv-button";
import { JobListEmpty } from "@/components/jobs/job-list-empty";
import { JobListError } from "@/components/jobs/job-list-error";
import { JobListSkeleton } from "@/components/jobs/job-list-skeleton";
import { PortalHeader } from "@/components/portal/portal-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { useJobApplied } from "@/hooks/use-job-applied";
import { useJobFavorites } from "@/hooks/use-job-favorites";
import { useJobListings } from "@/hooks/use-job-listings";
import { rebuildJobListingResume } from "@/lib/api/job-listings";
import { exportJobListingsCsv } from "@/lib/export-job-listings-csv";
import {
  DATE_FILTER_OPTIONS,
  filterJobListings,
  formatSyncedLabel,
  uniqueValues,
} from "@/lib/jobs-display";
import { cn } from "@/lib/utils";
import type { JobListingDateFilter } from "@/types/job-listing";

type JobsListView = "all" | "favorites";

export function ScrappedJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { favoritesCount, syncFromListItems: syncFavoritesFromListItems } =
    useJobFavorites();
  const { syncFromListItems: syncAppliedFromListItems } = useJobApplied();
  const prevFavoritesCount = React.useRef(favoritesCount);

  const listView: JobsListView =
    searchParams.get("view") === "favorites" ? "favorites" : "all";
  const favoritesOnly = listView === "favorites";

  const [dateFilter, setDateFilter] = React.useState<JobListingDateFilter>("all");
  const [listedOn, setListedOn] = React.useState("");

  const {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error,
    dateCounts,
    refetch,
    setPage,
  } = useJobListings({
    dateFilter,
    listedOn: dateFilter === "on_date" ? listedOn : undefined,
    favoritesOnly,
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
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

  const newTodayCount = dateCounts.today;

  const filteredItems = React.useMemo(() => {
    let list = filterJobListings(items, searchQuery);
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
  }, [items, searchQuery, typeFilter, locationFilter]);

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

  const hasClientFilters = Boolean(searchQuery || typeFilter || locationFilter);
  const hasDateFilter = dateFilter !== "all";
  const awaitingSpecificDate = dateFilter === "on_date" && !listedOn;

  React.useEffect(() => {
    if (selectedId && !items.some((j) => j.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  React.useEffect(() => {
    syncFavoritesFromListItems(items);
    syncAppliedFromListItems(items);
  }, [items, syncFavoritesFromListItems, syncAppliedFromListItems]);

  React.useEffect(() => {
    if (favoritesOnly && prevFavoritesCount.current !== favoritesCount) {
      refetch();
    }
    prevFavoritesCount.current = favoritesCount;
  }, [favoritesCount, favoritesOnly, refetch]);

  function setListView(next: JobsListView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "favorites") {
      params.set("view", "favorites");
    } else {
      params.delete("view");
    }
    const qs = params.toString();
    router.replace(qs ? `${ROUTES.scrappedJobs}?${qs}` : ROUTES.scrappedJobs, {
      scroll: false,
    });
  }

  function onDateFilterChange(value: string) {
    const next = value as JobListingDateFilter;
    setDateFilter(next);
    if (next !== "on_date") {
      setListedOn("");
    }
  }

  const handleRebuildResume = React.useCallback(
    async (listingId: string): Promise<Blob | null> => {
      const token = session?.accessToken;
      if (!token) {
        throw new Error("Sign in to rebuild your resume.");
      }
      return rebuildJobListingResume(token, listingId);
    },
    [session?.accessToken],
  );

  const handleExportCsv = React.useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      throw new Error("Sign in to export jobs.");
    }
    await exportJobListingsCsv({
      accessToken: token,
      dateFilter,
      listedOn,
      favoritesOnly,
      searchQuery,
      typeFilter,
      locationFilter,
    });
  }, [
    session?.accessToken,
    dateFilter,
    listedOn,
    favoritesOnly,
    searchQuery,
    typeFilter,
    locationFilter,
  ]);

  const exportDisabled =
    !session?.accessToken ||
    isLoading ||
    awaitingSpecificDate ||
    total === 0;

  return (
    <div className={cn("scrapped-jobs-layout", hasDetail && "scrapped-jobs-layout--split")}>
      <div className="scrapped-jobs-main">
        <PortalHeader
          title="Scrapped Jobs"
          subtitle={formatSyncedLabel(latestCreated)}
          actions={
            <>
              <JobExportCsvButton
                onExport={handleExportCsv}
                disabled={exportDisabled}
              />
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
            <p className="text-2xl font-bold tracking-tight">{dateCounts.all}</p>
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
                Favorites
              </p>
              <Heart
                className="size-4 text-[var(--portal-accent)] opacity-90"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <p className="text-2xl font-bold tracking-tight">{favoritesCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Saved to apply later</p>
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
          <select
            className="portal-filter-select"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            aria-label="Filter by date listed"
          >
            {DATE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {dateFilter === "on_date" ? (
            <input
              type="date"
              className="portal-filter-select h-9 min-w-[10.5rem] px-2"
              value={listedOn}
              onChange={(e) => setListedOn(e.target.value)}
              aria-label="Listed on specific date"
            />
          ) : null}
        </div>

        <nav className="portal-tabs mb-4" aria-label="Job list">
          <button
            type="button"
            className="portal-tab"
            data-active={listView === "all" ? "true" : undefined}
            onClick={() => setListView("all")}
          >
            All Jobs ({dateCounts.all})
          </button>
          <button
            type="button"
            className="portal-tab"
            data-active={listView === "favorites" ? "true" : undefined}
            onClick={() => setListView("favorites")}
          >
            Favorites ({favoritesCount})
          </button>
        </nav>

        {isLoading ? <JobListSkeleton /> : null}
        {error && !isLoading ? (
          <JobListError message={error} onRetry={refetch} />
        ) : null}

        {!isLoading && !error && awaitingSpecificDate ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Choose a date to see listings from that day.
          </p>
        ) : null}

        {!isLoading && !error && !awaitingSpecificDate && filteredItems.length === 0 ? (
          <JobListEmpty
            filtered={hasClientFilters || hasDateFilter}
            favoritesView={favoritesOnly}
          />
        ) : null}

        {!isLoading && !error && !awaitingSpecificDate && filteredItems.length > 0 ? (
          <div className="job-list space-y-3">
            {filteredItems.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedId === job.id}
                activeDateFilter={dateFilter}
                onRebuildResume={handleRebuildResume}
                onSelect={() => setSelectedId(job.id)}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && !awaitingSpecificDate && totalPages > 1 ? (
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
            activeDateFilter={dateFilter}
            onClose={() => setSelectedId(null)}
          />
        </>
      ) : null}
    </div>
  );
}
