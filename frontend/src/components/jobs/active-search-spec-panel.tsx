import type { ComponentType } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  DollarSign,
  Factory,
  MapPin,
  PenLine,
  SlidersHorizontal,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { JobApplicationDetail } from "@/lib/api/job-applications";
import {
  buildActiveSearchSpecChips,
  type ActiveSearchSpecChip,
} from "@/lib/active-search-spec";

type ActiveSearchSpecPanelProps = {
  spec: JobApplicationDetail | null;
  isLoading?: boolean;
};

const CHIP_ICONS: Record<
  ActiveSearchSpecChip["kind"],
  ComponentType<{ className?: string }>
> = {
  name: User,
  mode: MapPin,
  industry: Factory,
  title: Briefcase,
  pay: DollarSign,
  must: BadgeCheck,
};

export function ActiveSearchSpecPanel({
  spec,
  isLoading = false,
}: ActiveSearchSpecPanelProps) {
  const chips = spec ? buildActiveSearchSpecChips(spec) : [];

  return (
    <section
      className="portal-active-spec"
      aria-label="Active search spec"
      aria-busy={isLoading}
    >
      <div className="portal-active-spec-header">
        <div className="flex items-center gap-2.5">
          <span className="portal-active-spec-icon" aria-hidden>
            <SlidersHorizontal className="size-4" />
          </span>
          <h2 className="portal-active-spec-title">Active Search Spec</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-border px-3 text-xs"
          asChild
        >
          <Link href={ROUTES.jobSpecs}>
            <PenLine className="size-3.5" aria-hidden />
            Edit
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="portal-active-spec-chips" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className="portal-active-spec-chip portal-active-spec-chip--skeleton"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !spec ? (
        <p className="portal-active-spec-empty">
          No job spec yet.{" "}
          <Link href={ROUTES.jobSpecs} className="portal-dashboard-text-link">
            Submit your first spec
          </Link>{" "}
          to start scraping matching roles.
        </p>
      ) : null}

      {!isLoading && spec && chips.length > 0 ? (
        <div className="portal-active-spec-chips">
          {chips.map((chip) => {
            const Icon = CHIP_ICONS[chip.kind];
            return (
              <span
                key={chip.id}
                className="portal-active-spec-chip"
                data-accent={chip.accent}
              >
                <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{chip.label}</span>
              </span>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
