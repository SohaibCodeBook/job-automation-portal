"use client";

import * as React from "react";
import { ExternalLink, X } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { getJobListing } from "@/lib/api/job-listings";
import { companyInitials, displayPostedTime } from "@/lib/jobs-display";
import { cn } from "@/lib/utils";
import type { JobListingDetail } from "@/types/job-listing";

type JobDetailPanelProps = {
  listingId: string;
  onClose: () => void;
  className?: string;
};

function AboutTheRole({ text }: { text: string }) {
  const proseId = React.useId();
  const [expanded, setExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);
  const proseRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    setExpanded(false);
  }, [text]);

  React.useLayoutEffect(() => {
    const el = proseRef.current;
    if (!el) return;
    if (expanded) {
      setCanExpand(true);
      return;
    }
    setCanExpand(el.scrollHeight > el.clientHeight + 2);
  }, [text, expanded]);

  return (
    <section className="job-detail-section">
      <h3 className="job-detail-section-title">About the role</h3>
      <p
        ref={proseRef}
        id={proseId}
        className={cn(
          "job-detail-prose",
          !expanded && "job-detail-prose--clamped",
        )}
      >
        {text}
      </p>
      {canExpand ? (
        <button
          type="button"
          className="job-detail-read-more"
          aria-expanded={expanded}
          aria-controls={proseId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </section>
  );
}

function DetailField({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string | null;
}) {
  const display = value?.trim() || "—";
  return (
    <div className="job-detail-field">
      <p className="job-detail-field-label">{label}</p>
      {href && value?.trim() ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="job-detail-field-link"
        >
          {display}
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        </a>
      ) : (
        <p className="job-detail-field-value">{display}</p>
      )}
    </div>
  );
}

export function JobDetailPanel({
  listingId,
  onClose,
  className,
}: JobDetailPanelProps) {
  const { data: session } = useSession();
  const [detail, setDetail] = React.useState<JobListingDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (!token) {
      setError("Sign in to view job details.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setDetail(null);

    getJobListing(token, listingId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load job.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listingId, session?.accessToken]);

  return (
    <aside
      className={cn("job-detail-panel", className)}
      aria-label="Job details"
    >
      {isLoading ? (
        <div className="job-detail-panel-scroll space-y-4 p-4" aria-busy="true">
          <div className="flex justify-end">
            <button
              type="button"
              className="job-detail-close"
              onClick={onClose}
              aria-label="Close job details"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        </div>
      ) : null}

      {error && !isLoading ? (
        <div className="job-detail-panel-scroll p-4">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              className="job-detail-close"
              onClick={onClose}
              aria-label="Close job details"
            >
              <X className="size-5" />
            </button>
          </div>
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        </div>
      ) : null}

      {detail && !isLoading && !error ? (
        <>
          <div className="job-detail-panel-head">
            <div className="job-detail-panel-header">
              <button
                type="button"
                className="job-detail-close"
                onClick={onClose}
                aria-label="Close job details"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="job-detail-hero">
              <div className="job-card-logo size-12 text-sm">
                {companyInitials(detail.company)}
              </div>
              <div className="min-w-0">
                <h2 className="job-detail-title">{detail.title ?? "Untitled role"}</h2>
                <p className="job-detail-subtitle">
                  {[detail.company, detail.location].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <div className="job-detail-tags">
              {detail.employment_type ? (
                <span className="job-card-tag">{detail.employment_type}</span>
              ) : null}
              {detail.work_type ? (
                <span className="job-card-tag">{detail.work_type}</span>
              ) : null}
              {detail.field ? <span className="job-card-tag">{detail.field}</span> : null}
              {detail.job_origin ? (
                <span className="job-card-tag">{detail.job_origin}</span>
              ) : null}
            </div>

            <div className="job-detail-actions">
              {detail.url ? (
                <Button className="portal-btn-primary w-full" asChild>
                  <a href={detail.url} target="_blank" rel="noopener noreferrer">
                    Apply now — open job listing
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                </Button>
              ) : (
                <Button className="portal-btn-primary w-full" disabled>
                  Apply now — no URL available
                </Button>
              )}
            </div>
          </div>

          <div className="job-detail-panel-scroll">
            <div className="job-detail-grid">
              <DetailField label="Job title" value={detail.title} />
              <DetailField label="Company" value={detail.company} />
              <DetailField label="Location" value={detail.location} />
              <DetailField label="Pay range" value={detail.pay_range} />
              <DetailField label="Employment type" value={detail.employment_type} />
              <DetailField label="Work type" value={detail.work_type} />
              <DetailField
                label="Posted"
                value={displayPostedTime(detail.posted_time, detail.created_at)}
              />
              <DetailField label="Field" value={detail.field} />
              <DetailField label="Industries" value={detail.industries} />
              <DetailField label="Source" value={detail.job_origin} />
              <DetailField label="Name" value={detail.name} />
              <DetailField label="Omit words" value={detail.omit_words} />
              <DetailField
                label="Company website"
                value={detail.company_website ?? detail.company_url}
                href={
                  detail.company_website?.startsWith("http")
                    ? detail.company_website
                    : detail.company_website
                      ? `https://${detail.company_website}`
                      : detail.company_url
                }
              />
              <DetailField label="Job URL" value="View listing" href={detail.url} />
            </div>

            {detail.about_job ? <AboutTheRole text={detail.about_job} /> : null}
          </div>
        </>
      ) : null}
    </aside>
  );
}
