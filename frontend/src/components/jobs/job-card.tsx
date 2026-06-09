"use client";

import * as React from "react";
import { Download, FilePenLine, Loader2 } from "lucide-react";

import { JobApplyActions } from "@/components/jobs/job-apply-actions";
import { JobFavoriteButton } from "@/components/jobs/job-favorite-button";
import { Button } from "@/components/ui/button";
import {
  companyInitials,
  formatListingCreatedAt,
  formatListingCreatedAtAbsolute,
  isNewToday,
} from "@/lib/jobs-display";
import { cn } from "@/lib/utils";
import type { JobListingDateFilter, JobListingListItem } from "@/types/job-listing";

type JobCardProps = {
  job: JobListingListItem;
  selected?: boolean;
  activeDateFilter?: JobListingDateFilter;
  onSelect: () => void;
  /** Phase 3: orchestrates extract → rebuild and returns docx blob for download. */
  onRebuildResume?: (listingId: string) => Promise<Blob | null>;
};

function buildDownloadFilename(job: JobListingListItem): string {
  const company = job.company?.trim().replace(/\s+/g, "-") || "company";
  const title = job.title?.trim().replace(/\s+/g, "-") || "role";
  return `${company}-${title}-resume.docx`.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export function JobCard({
  job,
  selected = false,
  activeDateFilter,
  onSelect,
  onRebuildResume,
}: JobCardProps) {
  const [isRebuilding, setIsRebuilding] = React.useState(false);
  const [rebuildError, setRebuildError] = React.useState<string | null>(null);
  const [downloadBlob, setDownloadBlob] = React.useState<Blob | null>(null);

  const initials = companyInitials(job.company);
  const isNew = isNewToday(job.created_at);
  const tags = [
    job.employment_type,
    job.work_type,
    job.field,
    job.job_origin,
  ].filter(Boolean) as string[];

  async function handleRebuildResume(event: React.MouseEvent) {
    event.stopPropagation();
    if (isRebuilding || !onRebuildResume) return;

    setRebuildError(null);
    setIsRebuilding(true);
    try {
      const blob = await onRebuildResume(job.id);
      if (blob) {
        setDownloadBlob(blob);
      }
    } catch (err) {
      setRebuildError(
        err instanceof Error ? err.message : "Failed to rebuild resume.",
      );
      setDownloadBlob(null);
    } finally {
      setIsRebuilding(false);
    }
  }

  function handleDownloadResume(event: React.MouseEvent) {
    event.stopPropagation();
    if (!downloadBlob) return;

    const url = URL.createObjectURL(downloadBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildDownloadFilename(job);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      data-selected={selected ? "true" : undefined}
      className={cn("job-card", selected && "job-card--selected")}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="job-card-logo">{initials}</div>

      <div className="job-card-body min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="job-card-title">{job.title ?? "Untitled role"}</h2>
          {isNew ? <span className="job-card-badge job-card-badge--new">New</span> : null}
        </div>
        <p className="job-card-meta">
          {job.company ? (
            <span className="job-card-company">{job.company}</span>
          ) : null}
          {job.location ? (
            <span className="job-card-location">
              {job.company ? " · " : ""}
              {job.location}
            </span>
          ) : null}
        </p>
        {tags.length > 0 ? (
          <div className="job-card-tags">
            {tags.map((tag) => (
              <span key={tag} className="job-card-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <p
          className="job-card-footer text-xs text-muted-foreground"
          title={
            job.created_at
              ? formatListingCreatedAtAbsolute(job.created_at)
              : undefined
          }
        >
          {[
            job.field,
            formatListingCreatedAt(job.created_at, { activeDateFilter }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="job-card-actions">
        {job.pay_range ? (
          <p className="job-card-salary">{job.pay_range}</p>
        ) : null}
        <div className="job-card-action-row flex flex-wrap items-center justify-end gap-2">
          <span className="job-card-rebuild-beam-wrap">
            <span className="job-card-rebuild-beam" aria-hidden="true" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="job-card-rebuild-btn gap-1.5 border-0 bg-transparent shadow-none dark:border-0 dark:bg-transparent"
              disabled={isRebuilding}
              onClick={handleRebuildResume}
            >
              {isRebuilding ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Rebuilding…
                </>
              ) : (
                <>
                  <span className="job-card-rebuild-icon-dot" aria-hidden="true" />
                  <FilePenLine
                    className="job-card-rebuild-icon-pen size-3.5"
                    aria-hidden
                  />
                  Rebuild resume
                </>
              )}
            </Button>
          </span>
          {downloadBlob ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="job-card-download-btn gap-1.5"
              onClick={handleDownloadResume}
            >
              <Download className="size-3.5" aria-hidden />
              Download resume
            </Button>
          ) : null}
          <JobFavoriteButton
            listingId={job.id}
            initialFavorited={job.is_favorited}
          />
          <JobApplyActions
            listingId={job.id}
            url={job.url}
            initialApplied={job.is_applied}
          />
        </div>
        {rebuildError ? (
          <p
            className="job-card-rebuild-error mt-1 max-w-[14rem] text-right text-xs text-destructive"
            onClick={(e) => e.stopPropagation()}
          >
            {rebuildError}
          </p>
        ) : null}
      </div>
    </article>
  );
}
