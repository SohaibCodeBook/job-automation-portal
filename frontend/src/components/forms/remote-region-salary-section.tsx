"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getRemoteRegionPickerOption,
  getRemoteRegionPickerOptions,
  currencyBadgeLabel,
  syncPayRangeFilterWithRegions,
} from "@/constants/regions";
import type { JobSearchFormValues } from "@/types/job-search-form";

import { PayRangeDualSlider } from "./pay-range-dual-slider";

const MAX_REGIONS = 3;

const PICKER_OPTIONS = getRemoteRegionPickerOptions();

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

  const panelRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const portalDropdownRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const inputId = React.useId();

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [listBox, setListBox] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const atCap = selectedRegions.length >= MAX_REGIONS;
  const inputDisabled = atCap;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return PICKER_OPTIONS.filter(
      (opt) => !selectedRegions.includes(opt.regionValue),
    ).filter((opt) => {
      if (!q) return true;
      return (
        opt.displayLabel.toLowerCase().includes(q) ||
        opt.libraryName.toLowerCase().includes(q)
      );
    });
  }, [query, selectedRegions]);

  const noMatch = query.trim().length > 0 && filtered.length === 0;

  React.useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (event: PointerEvent) => {
      const panel = panelRef.current;
      const portalEl = portalDropdownRef.current;
      const target = event.target as Node;
      if (panel?.contains(target)) return;
      if (portalEl?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);

  const syncListPosition = React.useCallback(() => {
    const el = anchorRef.current;
    if (!el || typeof window === "undefined") {
      setListBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const top = r.bottom + 4;
    const maxHeight = Math.max(120, Math.min(256, window.innerHeight - top - 12));
    setListBox({
      top,
      left: r.left,
      width: r.width,
      maxHeight,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open || inputDisabled) {
      setListBox(null);
      return;
    }
    syncListPosition();
    const onScrollOrResize = () => syncListPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, inputDisabled, syncListPosition, query, filtered.length]);

  const applyRegions = (next: string[]) => {
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

  const addRegion = (region: string) => {
    if (selectedRegions.includes(region)) return;
    if (selectedRegions.length >= MAX_REGIONS) return;
    applyRegions([...selectedRegions, region]);
    setQuery("");
    setOpen(false);
  };

  const removeRegion = (region: string) => {
    applyRegions(selectedRegions.filter((r) => r !== region));
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

  const dropdownBody =
    open && !inputDisabled ? (
      <>
        {filtered.map((opt) => (
          <button
            key={opt.regionValue}
            type="button"
            role="option"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => addRegion(opt.regionValue)}
          >
            <span className="text-base leading-none" aria-hidden>
              {opt.flag}
            </span>
            <span className="truncate text-sm font-medium">{opt.displayLabel}</span>
          </button>
        ))}
        {noMatch ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No countries found.</p>
        ) : null}
      </>
    ) : null;

  const dropdownPortal =
    open &&
    !inputDisabled &&
    listBox &&
    typeof document !== "undefined" &&
    dropdownBody
      ? createPortal(
          <div
            ref={portalDropdownRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: listBox.top,
              left: listBox.left,
              width: listBox.width,
              maxHeight: listBox.maxHeight,
              zIndex: 10000,
            }}
            className="overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 [scrollbar-gutter:stable]"
          >
            {dropdownBody}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={panelRef}
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
              Search and choose up to {MAX_REGIONS} countries for salary filters.
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

      <div ref={anchorRef} className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          value={query}
          disabled={inputDisabled}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          role="combobox"
          onChange={(event) => {
            setQuery(event.target.value);
            if (!inputDisabled) setOpen(true);
          }}
          onFocus={() => {
            if (!inputDisabled) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (inputDisabled) return;
            if (event.key === "Enter") {
              event.preventDefault();
              if (filtered[0]) addRegion(filtered[0].regionValue);
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-10 pl-9 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="Search countries..."
        />
      </div>

      {dropdownPortal}

      {atCap ? (
        <p className="text-xs text-muted-foreground">
          Maximum {MAX_REGIONS} countries — remove one to add another.
        </p>
      ) : null}

      {selectedRegions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedRegions.map((region) => {
            const opt = getRemoteRegionPickerOption(region);
            return (
              <span
                key={region}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm"
              >
                <span aria-hidden>{opt?.flag ?? "🌐"}</span>
                <span>{region}</span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="size-4 rounded-full"
                  onClick={() => removeRegion(region)}
                  aria-label={`Remove ${region}`}
                >
                  ×
                </Button>
              </span>
            );
          })}
        </div>
      ) : null}

      {selectedRegions.length > 0 ? (
        <div className="space-y-4 border-t border-border pt-4">
          {selectedRegions.map((region) => {
            const row = payRangeFilter[region];
            if (!row) return null;
            const opt = getRemoteRegionPickerOption(region);
            const slug = region.replace(/\s+/g, "-").toLowerCase();
            return (
              <Card key={region} size="sm" className="border-border bg-card shadow-none">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                      {opt ? (
                        <>
                          <span aria-hidden>{opt.flag}</span>
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
