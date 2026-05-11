"use client";

import * as React from "react";
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

  const [mode, setMode] = React.useState<SearchMode>("city");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const modeOptions = mode === "city" ? HYBRID_CITY_OPTIONS : HYBRID_STATE_OPTIONS;
  const selectedActive = mode === "city" ? selectedCities : selectedStates;

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

  const totalAdded = selectedCities.length + selectedStates.length;

  const addItem = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    if (mode === "city") {
      if (selectedCities.includes(normalized)) return;
      setValue("selectedCities", [...selectedCities, normalized], {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    if (selectedStates.includes(normalized)) return;
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
    addItem(name);
    setQuery("");
    setOpen(false);
  };

  const noMatch = query.trim().length > 0 && filtered.length === 0;

  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-xl border border-border bg-muted/30 ring-1 ring-foreground/5",
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
          {totalAdded} {totalAdded === 1 ? "location" : "locations"} added
        </span>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Search and add cities or states for hybrid matches.
        </p>

        <div className="relative">
          <div className="flex overflow-hidden rounded-lg border border-input bg-background">
            <div className="flex shrink-0 border-r border-input">
              <button
                type="button"
                onClick={() => {
                  setMode("city");
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "h-10 px-4 text-sm font-medium transition-colors",
                  mode === "city"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                🏙️ City
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("state");
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "h-10 border-l border-input px-4 text-sm font-medium transition-colors",
                  mode === "state"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                🗺️ State
              </button>
            </div>
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
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
              className="h-10 border-0 ring-0 focus-visible:ring-0"
              placeholder={
                mode === "city" ? "Search cities..." : "Search states / provinces..."
              }
            />
          </div>

          {open ? (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
              {filtered.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
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

              {noMatch ? (
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
            </div>
          ) : null}
        </div>

        {(errors.selectedCities?.message || errors.selectedStates?.message) && (
          <p className="text-xs text-destructive">
            {errors.selectedCities?.message ?? errors.selectedStates?.message}
          </p>
        )}

        {totalAdded > 0 ? (
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
