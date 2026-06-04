"use client";

import { Bookmark, ChevronRight } from "lucide-react";

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
};

export function JobCard({
  job,
  selected = false,
  activeDateFilter,
  onSelect,
}: JobCardProps) {
  const initials = companyInitials(job.company);
  const isNew = isNewToday(job.created_at);
  const tags = [
    job.employment_type,
    job.work_type,
    job.field,
    job.job_origin,
  ].filter(Boolean) as string[];

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="job-card-icon-btn"
            aria-label="Save job (coming soon)"
            onClick={(e) => e.stopPropagation()}
            disabled
          >
            <Bookmark className="size-4" strokeWidth={1.75} />
          </button>
          {job.url ? (
            <Button
              size="sm"
              className="portal-btn-primary gap-1"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply
                <ChevronRight className="size-3.5" aria-hidden />
              </a>
            </Button>
          ) : (
            <Button
              size="sm"
              className="portal-btn-primary gap-1"
              disabled
              onClick={(e) => e.stopPropagation()}
            >
              Apply
              <ChevronRight className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
