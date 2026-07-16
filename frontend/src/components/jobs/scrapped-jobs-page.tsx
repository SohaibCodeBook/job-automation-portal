"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Heart,
  Search,
  Send,
} from "lucide-react";

import { useSession } from "next-auth/react";

import { ActiveSearchSpecPanel } from "@/components/jobs/active-search-spec-panel";
import { JobBulkToolbar } from "@/components/jobs/job-bulk-toolbar";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { JobListEmpty } from "@/components/jobs/job-list-empty";
import { JobListError } from "@/components/jobs/job-list-error";
import { JobListSkeleton } from "@/components/jobs/job-list-skeleton";
import { ScrappedJobsPageHeader } from "@/components/jobs/scrapped-jobs-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { useJobApplied } from "@/hooks/use-job-applied";
import { useJobArchived } from "@/hooks/use-job-archived";
import { useJobFavorites } from "@/hooks/use-job-favorites";
import { useJobListings } from "@/hooks/use-job-listings";
import { useLatestJobSpec } from "@/hooks/use-latest-job-spec";
import { rebuildJobListingResume } from "@/lib/api/job-listings";
import { exportJobListingsCsv } from "@/lib/export-job-listings-csv";
import {
  DATE_FILTER_OPTIONS,
  formatSyncedLabel,
} from "@/lib/jobs-display";
import { cn } from "@/lib/utils";
import type { JobListingDateFilter } from "@/types/job-listing";

type JobsListView = "all" | "favorites" | "applied" | "archived";

export function ScrappedJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { favoritesCount, syncFromListItems: syncFavoritesFromListItems } =
    useJobFavorites();
  const {
    appliedCount,
    syncFromListItems: syncAppliedFromListItems,
  } = useJobApplied();
  const {
    archivedCount,
    bulkArchive,
    refreshArchived,
    syncFromListItems: syncArchivedFromListItems,
  } = useJobArchived();
  const prevFavoritesCount = React.useRef(favoritesCount);
  const prevAppliedCount = React.useRef(appliedCount);
  const prevArchivedCount = React.useRef(archivedCount);

  const viewParam = searchParams.get("view");
  const listView: JobsListView =
    viewParam === "favorites"
      ? "favorites"
      : viewParam === "applied"
        ? "applied"
        : viewParam === "archived"
          ? "archived"
          : "all";
  const favoritesOnly = listView === "favorites";
  const appliedOnly = listView === "applied";
  const archivedOnly = listView === "archived";

  const [dateFilter, setDateFilter] = React.useState<JobListingDateFilter>("all");
  const [listedOn, setListedOn] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error,
    dateCounts,
    filterOptions,
    refetch,
    setPage,
    updateItemNote,
  } = useJobListings({
    dateFilter,
    listedOn: dateFilter === "on_date" ? listedOn : undefined,
    favoritesOnly,
    appliedOnly,
    archivedOnly,
    searchQuery,
    typeFilter,
    locationFilter,
  });
  const { spec: latestJobSpec, isLoading: latestSpecLoading } = useLatestJobSpec();

  const latestCreated = React.useMemo(() => {
    let latest: string | null = null;
    for (const job of items) {
      if (!job.created_at) continue;
      if (!latest || job.created_at > latest) latest = job.created_at;
    }
    return latest;
  }, [items]);

  const newTodayCount = dateCounts.today;

  const typeOptions = React.useMemo(
    () =>
      [
        ...new Set([
          ...filterOptions.employment_types,
          ...filterOptions.work_types,
        ]),
      ].sort(),
    [filterOptions.employment_types, filterOptions.work_types],
  );
  const locations = filterOptions.locations;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasDetail = selectedId != null;

  const hasSearchFilters = Boolean(searchQuery || typeFilter || locationFilter);
  const hasDateFilter = dateFilter !== "all";
  const awaitingSpecificDate = dateFilter === "on_date" && !listedOn;

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [
    listView,
    page,
    dateFilter,
    listedOn,
    searchQuery,
    typeFilter,
    locationFilter,
  ]);

  React.useEffect(() => {
    if (selectedId && !items.some((j) => j.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  React.useEffect(() => {
    syncFavoritesFromListItems(items);
    syncAppliedFromListItems(items);
    syncArchivedFromListItems(items);
  }, [
    items,
    syncFavoritesFromListItems,
    syncAppliedFromListItems,
    syncArchivedFromListItems,
  ]);

  React.useEffect(() => {
    if (favoritesOnly && prevFavoritesCount.current !== favoritesCount) {
      refetch();
    }
    prevFavoritesCount.current = favoritesCount;
  }, [favoritesCount, favoritesOnly, refetch]);

  React.useEffect(() => {
    if (appliedOnly && prevAppliedCount.current !== appliedCount) {
      refetch();
    }
    prevAppliedCount.current = appliedCount;
  }, [appliedCount, appliedOnly, refetch]);

  React.useEffect(() => {
    if (archivedOnly && prevArchivedCount.current !== archivedCount) {
      refetch();
    }
    prevArchivedCount.current = archivedCount;
  }, [archivedCount, archivedOnly, refetch]);

  function setListView(next: JobsListView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "favorites") {
      params.set("view", "favorites");
    } else if (next === "applied") {
      params.set("view", "applied");
    } else if (next === "archived") {
      params.set("view", "archived");
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
      appliedOnly,
      searchQuery,
      typeFilter,
      locationFilter,
    });
  }, [
    session?.accessToken,
    dateFilter,
    listedOn,
    favoritesOnly,
    appliedOnly,
    searchQuery,
    typeFilter,
    locationFilter,
  ]);

  const handleCheckedChange = React.useCallback(
    (listingId: string, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    },
    [],
  );

  const handleSelectAllOnPage = React.useCallback(() => {
    setSelectedIds(new Set(items.map((job) => job.id)));
  }, [items]);

  const handleClearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkArchiveToggle = React.useCallback(
    async (archived: boolean) => {
      if (selectedIds.size === 0 || bulkLoading) return;
      setBulkLoading(true);
      try {
        await bulkArchive([...selectedIds], archived);
        setSelectedIds(new Set());
        refetch();
        refreshArchived();
      } catch {
        // Errors surface via optimistic rollback in the hook.
      } finally {
        setBulkLoading(false);
      }
    },
    [bulkArchive, bulkLoading, refetch, refreshArchived, selectedIds],
  );

  const exportDisabled =
    !session?.accessToken ||
    isLoading ||
    awaitingSpecificDate ||
    total === 0;

  return (
    <div className={cn("scrapped-jobs-layout", hasDetail && "scrapped-jobs-layout--split")}>
      <div className="scrapped-jobs-main">
        <ScrappedJobsPageHeader
          subtitle={formatSyncedLabel(latestCreated)}
          onExportCsv={handleExportCsv}
          exportDisabled={exportDisabled}
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
            <p className="text-2xl font-bold tracking-tight">{appliedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Marked as applied</p>
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

        <ActiveSearchSpecPanel spec={latestJobSpec} isLoading={latestSpecLoading} />

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
          <button
            type="button"
            className="portal-tab"
            data-active={listView === "applied" ? "true" : undefined}
            onClick={() => setListView("applied")}
          >
            Applied ({appliedCount})
          </button>
          <button
            type="button"
            className="portal-tab"
            data-active={listView === "archived" ? "true" : undefined}
            onClick={() => setListView("archived")}
          >
            <span className="inline-flex items-center gap-1.5">
              <Archive className="size-3.5" aria-hidden />
              Archived ({archivedCount})
            </span>
          </button>
        </nav>

        <JobBulkToolbar
          selectedCount={selectedIds.size}
          pageItemCount={items.length}
          archivedView={archivedOnly}
          isLoading={bulkLoading}
          onSelectAllOnPage={handleSelectAllOnPage}
          onClear={handleClearSelection}
          onArchiveSelected={() => void handleBulkArchiveToggle(true)}
          onUnarchiveSelected={() => void handleBulkArchiveToggle(false)}
        />

        {isLoading ? <JobListSkeleton /> : null}
        {error && !isLoading ? (
          <JobListError message={error} onRetry={refetch} />
        ) : null}

        {!isLoading && !error && awaitingSpecificDate ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Choose a date to see listings from that day.
          </p>
        ) : null}

        {!isLoading && !error && !awaitingSpecificDate && items.length === 0 ? (
          <JobListEmpty
            filtered={hasSearchFilters || hasDateFilter}
            favoritesView={favoritesOnly}
            appliedView={appliedOnly}
            archivedView={archivedOnly}
          />
        ) : null}

        {!isLoading && !error && !awaitingSpecificDate && items.length > 0 ? (
          <div className="job-list space-y-3">
            {items.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedId === job.id}
                checked={selectedIds.has(job.id)}
                selectionMode
                activeDateFilter={dateFilter}
                onRebuildResume={handleRebuildResume}
                onSelect={() => setSelectedId(job.id)}
                onCheckedChange={(checked) =>
                  handleCheckedChange(job.id, checked)
                }
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
            onNoteUpdated={updateItemNote}
          />
        </>
      ) : null}
    </div>
  );
}
