"use client";

import { Archive, ArchiveRestore, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type JobBulkToolbarProps = {
  selectedCount: number;
  pageItemCount: number;
  archivedView?: boolean;
  isLoading?: boolean;
  onSelectAllOnPage: () => void;
  onClear: () => void;
  onArchiveSelected: () => void;
  onUnarchiveSelected: () => void;
};

export function JobBulkToolbar({
  selectedCount,
  pageItemCount,
  archivedView = false,
  isLoading = false,
  onSelectAllOnPage,
  onClear,
  onArchiveSelected,
  onUnarchiveSelected,
}: JobBulkToolbarProps) {
  if (selectedCount <= 0) return null;

  const allOnPageSelected =
    pageItemCount > 0 && selectedCount >= pageItemCount;

  return (
    <div
      className="portal-dashboard-panel mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium">
        {selectedCount} selected
        {pageItemCount > 0 ? (
          <span className="font-normal text-muted-foreground">
            {" "}
            · {pageItemCount} on this page
          </span>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || allOnPageSelected || pageItemCount === 0}
          onClick={onSelectAllOnPage}
        >
          Select all on page
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={onClear}
        >
          Clear
        </Button>
        {archivedView ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={isLoading}
            onClick={onUnarchiveSelected}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ArchiveRestore className="size-3.5" aria-hidden />
            )}
            Unarchive selected
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={isLoading}
            onClick={onArchiveSelected}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Archive className="size-3.5" aria-hidden />
            )}
            Archive selected
          </Button>
        )}
      </div>
    </div>
  );
}
