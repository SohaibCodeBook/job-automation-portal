"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HYBRID_CITY_OPTIONS,
  HYBRID_STATE_OPTIONS,
  type HybridLocationOption,
} from "@/constants/hybrid-locations";
import { cn } from "@/lib/utils";
import type { JobSearchFormValues } from "@/types/job-search-form";

const HYBRID_LOCATION_LIMIT = 3 as const;

type HybridLocationPreferencesPanelProps = {
  setValue: UseFormSetValue<JobSearchFormValues>;
  watch: UseFormWatch<JobSearchFormValues>;
  errors: FieldErrors<JobSearchFormValues>;
};

type SearchMode = "city" | "state";

function optionForName(
  options: readonly HybridLocationOption[],
  name: string,
): HybridLocationOption | undefined {
  return options.find((opt) => opt.name.toLowerCase() === name.toLowerCase());
}

export function HybridLocationPreferencesPanel({
  setValue,
  watch,
  errors,
}: HybridLocationPreferencesPanelProps) {
  const selectedCities = watch("selectedCities") ?? [];
  const selectedStates = watch("selectedStates") ?? [];

  const panelRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const portalDropdownRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const inputId = React.useId();

  const [mode, setMode] = React.useState<SearchMode>("city");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [listBox, setListBox] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const hasCitiesOnly = selectedCities.length > 0 && selectedStates.length === 0;
  const hasStatesOnly = selectedStates.length > 0 && selectedCities.length === 0;
  const cityTabDisabled = selectedStates.length > 0;
  const stateTabDisabled = selectedCities.length > 0;

  React.useEffect(() => {
    if (hasStatesOnly) setMode("state");
    else if (hasCitiesOnly) setMode("city");
  }, [hasCitiesOnly, hasStatesOnly]);

  const modeOptions = mode === "city" ? HYBRID_CITY_OPTIONS : HYBRID_STATE_OPTIONS;
  const selectedActive = mode === "city" ? selectedCities : selectedStates;

  const atLimitForMode =
    mode === "city"
      ? selectedCities.length >= HYBRID_LOCATION_LIMIT
      : selectedStates.length >= HYBRID_LOCATION_LIMIT;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return modeOptions
      .filter((opt) => !selectedActive.includes(opt.name))
      .filter((opt) => {
        if (!q) return true;
        return (
          opt.name.toLowerCase().includes(q) ||
          opt.subLabel.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [modeOptions, query, selectedActive]);

  const inputDisabled = atLimitForMode;
  const noMatch = query.trim().length > 0 && filtered.length === 0;

  const activeCount = Math.max(selectedCities.length, selectedStates.length);
  const activeKind: "city" | "state" | null =
    selectedCities.length > 0 ? "city" : selectedStates.length > 0 ? "state" : null;

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
  }, [open, inputDisabled, syncListPosition, mode, query, filtered.length]);

  const addItem = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;

    if (mode === "city") {
      if (selectedCities.includes(normalized)) return;
      if (selectedCities.length >= HYBRID_LOCATION_LIMIT) return;
      setValue("selectedStates", [], { shouldDirty: true, shouldValidate: true });
      setValue("selectedCities", [...selectedCities, normalized], {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    if (selectedStates.includes(normalized)) return;
    if (selectedStates.length >= HYBRID_LOCATION_LIMIT) return;
    setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
    setValue("selectedStates", [...selectedStates, normalized], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeItem = (name: string, fromMode: SearchMode) => {
    if (fromMode === "city") {
      setValue(
        "selectedCities",
        selectedCities.filter((x) => x !== name),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }
    setValue(
      "selectedStates",
      selectedStates.filter((x) => x !== name),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const onSelect = (name: string) => {
    if (atLimitForMode) return;
    addItem(name);
    setQuery("");
    setOpen(false);
  };

  const dropdownBody =
    open && !inputDisabled ? (
      <>
        {filtered.map((opt) => (
          <button
            key={opt.name}
            type="button"
            role="option"
            className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(opt.name)}
          >
            <span className="pt-0.5 text-base leading-none">{opt.flag}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{opt.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {opt.subLabel}
              </span>
            </span>
          </button>
        ))}

        {noMatch && !atLimitForMode ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(query.trim())}
          >
            <span className="text-base leading-none">➕</span>
            <span>
              Add custom location{" "}
              <span className="font-medium">"{query.trim()}"</span>
            </span>
          </button>
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
        "mt-4 overflow-visible rounded-xl border border-border bg-muted/30 ring-1 ring-foreground/5",
        "animate-in fade-in-0 slide-in-from-top-1 duration-200",
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none" aria-hidden>
            🗺️
          </span>
          <p className="text-sm font-semibold">Hybrid Location Preferences</p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {activeKind === null
            ? "0 locations"
            : `${activeCount}/${HYBRID_LOCATION_LIMIT} ${activeKind === "city" ? "cities" : "states"}`}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Use <span className="font-medium text-foreground">cities or states</span>, not
          both. Up to {HYBRID_LOCATION_LIMIT} per type. Clear one type to switch.
        </p>

        <div
          ref={anchorRef}
          className="flex overflow-hidden rounded-lg border border-input bg-background"
        >
          <div className="flex shrink-0 border-r border-input">
            <button
              type="button"
              disabled={cityTabDisabled}
              title={
                cityTabDisabled
                  ? "Remove all states to add cities instead."
                  : undefined
              }
              onClick={() => {
                if (cityTabDisabled) return;
                setMode("city");
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "h-10 px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                mode === "city"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              🏙️ City
            </button>
            <button
              type="button"
              disabled={stateTabDisabled}
              title={
                stateTabDisabled
                  ? "Remove all cities to add states instead."
                  : undefined
              }
              onClick={() => {
                if (stateTabDisabled) return;
                setMode("state");
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "h-10 border-l border-input px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                mode === "state"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              🗺️ State
            </button>
          </div>
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
                if (atLimitForMode) return;
                if (filtered[0]) {
                  onSelect(filtered[0].name);
                } else if (query.trim()) {
                  onSelect(query.trim());
                }
              }
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            className="h-10 border-0 ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={
              mode === "city" ? "Search cities..." : "Search states / provinces..."
            }
          />
        </div>

        {dropdownPortal}

        {atLimitForMode ? (
          <p className="text-xs text-muted-foreground">
            Maximum {HYBRID_LOCATION_LIMIT}{" "}
            {mode === "city" ? "cities" : "states or provinces"} — remove one to add
            another.
          </p>
        ) : null}

        {(errors.selectedCities?.message || errors.selectedStates?.message) && (
          <p className="text-xs text-destructive">
            {errors.selectedCities?.message ?? errors.selectedStates?.message}
          </p>
        )}

        {activeCount > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((name) => {
              const found = optionForName(HYBRID_CITY_OPTIONS, name);
              return (
                <span
                  key={`city-${name}`}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs"
                >
                  <span>{found?.flag ?? "📍"}</span>
                  <span>{name}</span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="size-4 rounded-full"
                    onClick={() => removeItem(name, "city")}
                    aria-label={`Remove city ${name}`}
                  >
                    ×
                  </Button>
                </span>
              );
            })}
            {selectedStates.map((name) => {
              const found = optionForName(HYBRID_STATE_OPTIONS, name);
              return (
                <span
                  key={`state-${name}`}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs"
                >
                  <span>{found?.flag ?? "📍"}</span>
                  <span>{name}</span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="size-4 rounded-full"
                    onClick={() => removeItem(name, "state")}
                    aria-label={`Remove state ${name}`}
                  >
                    ×
                  </Button>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
