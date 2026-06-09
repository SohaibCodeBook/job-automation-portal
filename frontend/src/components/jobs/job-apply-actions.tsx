"use client";

import * as React from "react";
import { ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useJobApplied } from "@/hooks/use-job-applied";
import { cn } from "@/lib/utils";

type JobApplyActionsProps = {
  listingId: string;
  url: string | null;
  initialApplied?: boolean;
  className?: string;
};

export function JobApplyActions({
  listingId,
  url,
  initialApplied = false,
  className,
}: JobApplyActionsProps) {
  const { isApplied, isUpdating, markApplied, unmarkApplied, isLoading } =
    useJobApplied();
  const applied = isApplied(listingId) || (isLoading && initialApplied);
  const updating = isUpdating(listingId);
  const [pendingMark, setPendingMark] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (applied) {
      setPendingMark(false);
    }
  }, [applied]);

  async function handleMarkApplied(event: React.MouseEvent) {
    event.stopPropagation();
    setActionError(null);
    try {
      await markApplied(listingId);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to mark as applied.",
      );
    }
  }

  async function handleUndo(event: React.MouseEvent) {
    event.stopPropagation();
    setActionError(null);
    try {
      await unmarkApplied(listingId);
      setPendingMark(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to undo applied status.",
      );
    }
  }

  function handleApplyClick(event: React.MouseEvent) {
    event.stopPropagation();
    setPendingMark(true);
    setActionError(null);
  }

  if (applied) {
    return (
      <div className={cn("job-card-apply-status", className)}>
        <span className="job-card-applied-badge">Applied</span>
        <button
          type="button"
          className="job-card-applied-undo"
          disabled={updating}
          onClick={handleUndo}
        >
          {updating ? "Undoing…" : "Undo"}
        </button>
        {actionError ? (
          <p className="job-card-apply-error">{actionError}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("job-card-apply-actions", className)}>
      <div className="job-card-apply-primary">
        {url ? (
          <Button
            size="sm"
            className="portal-btn-primary gap-1"
            asChild
            onClick={handleApplyClick}
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              Apply
              <ChevronRight className="size-3.5" aria-hidden />
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            className="portal-btn-primary gap-1"
            disabled
            onClick={(event) => event.stopPropagation()}
          >
            Apply
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
      {pendingMark ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="job-card-mark-applied-btn"
          disabled={updating}
          onClick={handleMarkApplied}
        >
          {updating ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Mark as Applied"
          )}
        </Button>
      ) : null}
      {actionError ? <p className="job-card-apply-error">{actionError}</p> : null}
    </div>
  );
}
