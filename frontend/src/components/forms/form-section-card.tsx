import * as React from "react";
import { Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FormSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  action?: React.ReactNode;
  /** Optional icon (e.g. Lucide) in the header tile when the section is not yet complete. */
  icon?: React.ReactNode;
  /** When true, the tile shows a checkmark on the title gradient teal (same as main page title). */
  sectionComplete?: boolean;
  /** 1-based index shown as a two-digit label (e.g. 03) on the right, like wizard sections. */
  sectionNumber?: number;
  /** Anchor id for scroll-into-view from the steps chain (`section-${id}`). */
  sectionId?: string;
};

export function FormSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
  action,
  icon,
  sectionComplete = false,
  sectionNumber,
  sectionId,
}: FormSectionCardProps) {
  const sectionLabel =
    sectionNumber !== undefined
      ? String(sectionNumber).padStart(2, "0")
      : null;

  const showStatusBadge =
    sectionNumber !== undefined || sectionComplete === true;

  const showIconTile = Boolean(icon) || sectionComplete;

  return (
    <Card
      id={sectionId}
      className={cn(
        "w-full overflow-visible",
        sectionId && "scroll-mt-28",
        className,
      )}
    >
      <CardHeader className="border-b border-border px-4 pb-4 group-data-[size=sm]/card:px-3">
        <div className="flex items-start gap-3 sm:gap-4">
          {showIconTile ? (
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 [&_svg]:pointer-events-none [&_svg]:shrink-0",
                sectionComplete
                  ? "bg-job-title-end text-white ring-black/15 dark:ring-white/25"
                  : "bg-neutral-950 text-neutral-50 ring-black/20 dark:bg-neutral-900 dark:ring-white/10",
              )}
              aria-hidden
            >
              {sectionComplete ? (
                <Check className="size-5" strokeWidth={2.5} />
              ) : (
                icon
              )}
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {sectionLabel !== null || action || showStatusBadge ? (
            <div className="flex shrink-0 flex-col items-end gap-2">
              {showStatusBadge ? (
                sectionComplete ? (
                  <span className="rounded-full border border-[var(--job-title-gradient-end)]/35 bg-[color-mix(in_oklab,var(--job-title-gradient-end)_12%,white)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--job-title-gradient-end)] dark:bg-[color-mix(in_oklab,var(--job-title-gradient-end)_28%,transparent)] dark:text-[color-mix(in_oklab,var(--job-title-gradient-end)_75%,white)]">
                    Done
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-200/90 bg-[#fff4eb] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#8b4d1b] dark:border-amber-800/55 dark:bg-amber-950/40 dark:text-amber-200/95">
                    Pending
                  </span>
                )
              ) : null}
              {sectionLabel !== null ? (
                <span className="text-sm font-medium tabular-nums tracking-tight text-muted-foreground">
                  {sectionLabel}
                </span>
              ) : null}
              {action ? <div>{action}</div> : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
