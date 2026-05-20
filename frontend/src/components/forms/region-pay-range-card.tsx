"use client";

import type { FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  currencyBadgeLabel,
  type RegionPayRangeEntry,
} from "@/constants/regions";
import type { JobSearchFormValues } from "@/types/job-search-form";

import { PayRangeDualSlider } from "./pay-range-dual-slider";

function regionPayErrors(
  errors: FieldErrors<JobSearchFormValues>,
  region: string,
): string | undefined {
  const block = errors.payRangeFilter?.[region];
  if (!block || typeof block !== "object") {
    return undefined;
  }
  if ("message" in block && typeof block.message === "string") {
    return block.message;
  }
  const minMsg =
    "min" in block &&
    block.min &&
    typeof block.min === "object" &&
    "message" in block.min
      ? String(block.min.message)
      : undefined;
  const maxMsg =
    "max" in block &&
    block.max &&
    typeof block.max === "object" &&
    "message" in block.max
      ? String(block.max.message)
      : undefined;
  return minMsg ?? maxMsg;
}

type RegionPayRangeCardProps = {
  region: string;
  flag?: string;
  row: RegionPayRangeEntry;
  errors: FieldErrors<JobSearchFormValues>;
  onRangeChange: (next: { min: number; max: number }) => void;
  onRemove?: () => void;
  idPrefix?: string;
};

export function RegionPayRangeCard({
  region,
  flag,
  row,
  errors,
  onRangeChange,
  onRemove,
  idPrefix = "pay",
}: RegionPayRangeCardProps) {
  const slug = region.replace(/\s+/g, "-").toLowerCase();

  return (
    <Card size="sm" className="border-border bg-card shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
            {flag ? <span aria-hidden>{flag}</span> : null}
            <span>{region}</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {currencyBadgeLabel(row.currency)}
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Drag handles to set min and max annual salary.
          </CardDescription>
        </div>
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            ✕ Remove
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <PayRangeDualSlider
          id={`${idPrefix}-${slug}`}
          currencyCode={row.currency}
          min={row.min}
          max={row.max}
          onChange={onRangeChange}
        />
        {regionPayErrors(errors, region) ? (
          <p className="text-xs text-destructive">{regionPayErrors(errors, region)}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
