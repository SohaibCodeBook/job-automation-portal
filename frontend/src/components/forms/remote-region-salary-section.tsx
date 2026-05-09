"use client";

import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  REMOTE_REGION_DEFINITIONS,
  type RemoteRegionValue,
  currencyBadgeLabel,
  syncPayRangeFilterWithRegions,
  type RegionPayRangeEntry,
} from "@/constants/regions";
import type { JobSearchFormValues } from "@/types/job-search-form";

import { PayRangeDualSlider } from "./pay-range-dual-slider";

const MAX_REGIONS = 3;

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

type RemoteRegionSalarySectionProps = {
  setValue: UseFormSetValue<JobSearchFormValues>;
  watch: UseFormWatch<JobSearchFormValues>;
  errors: FieldErrors<JobSearchFormValues>;
};

export function RemoteRegionSalarySection({
  setValue,
  watch,
  errors,
}: RemoteRegionSalarySectionProps) {
  const selectedRegions = watch("selectedRegions") ?? [];
  const payRangeFilter = watch("payRangeFilter") ?? {};

  const toggleRegion = (region: RemoteRegionValue) => {
    const next = [...selectedRegions];
    const idx = next.indexOf(region);
    if (idx >= 0) {
      next.splice(idx, 1);
    } else if (next.length < MAX_REGIONS) {
      next.push(region);
    }
    setValue("selectedRegions", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "payRangeFilter",
      syncPayRangeFilterWithRegions(payRangeFilter, next),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const removeRegion = (region: string) => {
    const next = selectedRegions.filter((r) => r !== region);
    setValue("selectedRegions", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "payRangeFilter",
      syncPayRangeFilterWithRegions(payRangeFilter, next),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const updateRange = (region: string, range: { min: number; max: number }) => {
    const prev = payRangeFilter[region];
    if (!prev) return;
    setValue(
      "payRangeFilter",
      {
        ...payRangeFilter,
        [region]: {
          ...prev,
          min: range.min,
          max: range.max,
        },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <div
      className={cn(
        "mt-4 space-y-4 rounded-xl border border-border bg-muted/30 p-4 ring-1 ring-foreground/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden>
            🌎
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">
              Select Regions for Remote Jobs
            </p>
            <p className="text-xs text-muted-foreground">
              Choose up to three regions for salary filters.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {selectedRegions.length} / {MAX_REGIONS} selected
        </span>
      </div>

      {errors.selectedRegions?.message ? (
        <p className="text-xs text-destructive">{errors.selectedRegions.message}</p>
      ) : null}
      {errors.payRangeFilter &&
      typeof errors.payRangeFilter === "object" &&
      "message" in errors.payRangeFilter &&
      typeof errors.payRangeFilter.message === "string" ? (
        <p className="text-xs text-destructive">
          {errors.payRangeFilter.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {REMOTE_REGION_DEFINITIONS.map((opt) => {
          const selected = selectedRegions.includes(opt.value);
          const atCap = selectedRegions.length >= MAX_REGIONS && !selected;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={atCap}
              onClick={() => toggleRegion(opt.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:bg-muted/80",
                atCap && !selected && "cursor-not-allowed opacity-50",
              )}
            >
              <span aria-hidden>{opt.flag}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {selectedRegions.length > 0 ? (
        <div className="space-y-4 border-t border-border pt-4">
          {selectedRegions.map((region) => {
            const row = payRangeFilter[region];
            if (!row) return null;
            const def = REMOTE_REGION_DEFINITIONS.find((d) => d.value === region);
            const slug = region.replace(/\s+/g, "-").toLowerCase();
            return (
              <Card key={region} size="sm" className="border-border bg-card shadow-none">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                      {def ? (
                        <>
                          <span aria-hidden>{def.flag}</span>
                          <span>{region}</span>
                        </>
                      ) : (
                        region
                      )}
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        {currencyBadgeLabel(row.currency)}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Drag handles to set min and max annual salary.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRegion(region)}
                  >
                    ✕ Remove
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <PayRangeDualSlider
                    id={`pay-${slug}`}
                    currencyCode={row.currency}
                    min={row.min}
                    max={row.max}
                    onChange={(next) => updateRange(region, next)}
                  />
                  {regionPayErrors(errors, region) ? (
                    <p className="text-xs text-destructive">
                      {regionPayErrors(errors, region)}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
