import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WizardSectionAccent } from "@/constants/wizard-section-accents";
import { cn } from "@/lib/utils";

type FormSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  action?: React.ReactNode;
  /** Optional icon (e.g. Lucide) in the header tile. */
  icon?: React.ReactNode;
  /** Color accent for the section icon tile. */
  sectionAccent?: WizardSectionAccent;
  /** When true, shows a green "Complete" status pill. */
  sectionComplete?: boolean;
  /** 1-based index shown as a two-digit label (e.g. 03) on the right. */
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
  sectionAccent = "blue",
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

  return (
    <Card
      id={sectionId}
      className={cn(
        "portal-spec-section-card w-full overflow-visible",
        sectionId && "scroll-mt-28",
        className,
      )}
    >
      <CardHeader className="portal-spec-section-header border-b px-4 pb-4 group-data-[size=sm]/card:px-3">
        <div className="flex items-start gap-3 sm:gap-4">
          {icon ? (
            <div
              className="portal-section-icon flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:pointer-events-none [&_svg]:shrink-0"
              data-accent={sectionAccent}
              aria-hidden
            >
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <CardTitle className="portal-spec-section-title">{title}</CardTitle>
              {showStatusBadge ? (
                sectionComplete ? (
                  <span className="portal-status-badge portal-status-badge--complete">
                    <span className="portal-status-badge-dot" aria-hidden />
                    Complete
                  </span>
                ) : (
                  <span className="portal-status-badge portal-status-badge--pending">
                    <span className="portal-status-badge-dot" aria-hidden />
                    Pending
                  </span>
                )
              ) : null}
            </div>
            {description ? (
              <CardDescription className="portal-spec-section-desc">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {sectionLabel !== null || action ? (
            <div className="flex shrink-0 flex-col items-end gap-2">
              {sectionLabel !== null ? (
                <span className="portal-section-number">{sectionLabel}</span>
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
