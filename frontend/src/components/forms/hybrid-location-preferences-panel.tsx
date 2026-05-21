"use client";

import * as React from "react";
import { Country } from "country-state-city";
import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getRemoteRegionPickerOption,
  syncPayRangeFilterWithRegions,
} from "@/constants/regions";
import {
  LocationSearchCombobox,
  type LocationSearchOption,
} from "@/components/forms/location-search-combobox";
import { RegionPayRangeCard } from "@/components/forms/region-pay-range-card";
import {
  getAllCountries,
  getStatesByCountry,
  searchCitiesInCountry,
} from "@/lib/locations";
import { cn } from "@/lib/utils";
import type { JobSearchFormValues } from "@/types/job-search-form";

const LOCATION_LIMIT = 3 as const;

type SearchMode = "state" | "city" | null;

type HybridLocationPreferencesPanelProps = {
  title?: string;
  setValue: UseFormSetValue<JobSearchFormValues>;
  watch: UseFormWatch<JobSearchFormValues>;
  errors: FieldErrors<JobSearchFormValues>;
};

function countryFlag(code: string): string {
  return Country.getCountryByCode(code)?.flag ?? "🌐";
}

function inferSearchMode(
  states: string[],
  cities: string[],
): SearchMode {
  if (cities.length > 0) return "city";
  if (states.length > 0) return "state";
  return null;
}

export function HybridLocationPreferencesPanel({
  title = "Hybrid Location Preferences",
  setValue,
  watch,
  errors,
}: HybridLocationPreferencesPanelProps) {
  const selectedCountryName = watch("selectedRegions")?.[0] ?? "";
  const selectedStates = watch("selectedStates") ?? [];
  const selectedCities = watch("selectedCities") ?? [];
  const payRangeFilter = watch("payRangeFilter") ?? {};

  const [searchMode, setSearchMode] = React.useState<SearchMode>(() =>
    inferSearchMode(selectedStates, selectedCities),
  );

  React.useEffect(() => {
    if (!selectedCountryName) {
      setSearchMode(null);
      return;
    }
    if (searchMode === null) {
      setSearchMode(inferSearchMode(selectedStates, selectedCities));
    }
  }, [
    selectedCountryName,
    selectedStates,
    selectedCities,
    searchMode,
  ]);

  const countryOptions = React.useMemo((): LocationSearchOption[] => {
    return getAllCountries().map((country) => ({
      value: country.name,
      label: country.name,
      leading: countryFlag(country.code),
    }));
  }, []);

  const countryCode = React.useMemo(() => {
    if (!selectedCountryName) return "";
    return (
      getAllCountries().find((c) => c.name === selectedCountryName)?.code ?? ""
    );
  }, [selectedCountryName]);

  const stateOptions = React.useMemo((): LocationSearchOption[] => {
    if (!countryCode) return [];
    return getStatesByCountry(countryCode)
      .filter((state) => !selectedStates.includes(state.name))
      .map((state) => ({
        value: state.name,
        label: state.name,
        subLabel: selectedCountryName,
      }));
  }, [countryCode, selectedCountryName, selectedStates]);

  const resolveCountryCityOptions = React.useCallback(
    (query: string): LocationSearchOption[] => {
      if (!countryCode) return [];
      return searchCitiesInCountry(countryCode, query)
        .filter((city) => !selectedCities.includes(city.name))
        .map((city) => ({
          value: city.name,
          label: city.name,
          subLabel: city.stateName,
        }));
    },
    [countryCode, selectedCities],
  );

  const atStateCap = selectedStates.length >= LOCATION_LIMIT;
  const atCityCap = selectedCities.length >= LOCATION_LIMIT;
  const countryMeta = selectedCountryName
    ? getRemoteRegionPickerOption(selectedCountryName)
    : undefined;
  const payRow = selectedCountryName
    ? payRangeFilter[selectedCountryName]
    : undefined;

  const setCountry = (name: string) => {
    setSearchMode(null);
    setValue("selectedRegions", [name], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "payRangeFilter",
      syncPayRangeFilterWithRegions(payRangeFilter, [name]),
      { shouldDirty: true, shouldValidate: true },
    );
    setValue("selectedStates", [], { shouldDirty: true, shouldValidate: true });
    setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
  };

  const clearCountry = () => {
    setSearchMode(null);
    setValue("selectedRegions", [], { shouldDirty: true, shouldValidate: true });
    setValue("payRangeFilter", {}, { shouldDirty: true, shouldValidate: true });
    setValue("selectedStates", [], { shouldDirty: true, shouldValidate: true });
    setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
  };

  const chooseSearchMode = (mode: "state" | "city") => {
    setSearchMode(mode);
    if (mode === "state") {
      setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
    } else {
      setValue("selectedStates", [], { shouldDirty: true, shouldValidate: true });
    }
  };

  const resetSearchMode = () => {
    setSearchMode(null);
    setValue("selectedStates", [], { shouldDirty: true, shouldValidate: true });
    setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
  };

  const addState = (name: string) => {
    if (selectedStates.includes(name)) return;
    if (selectedStates.length >= LOCATION_LIMIT) return;
    setValue("selectedStates", [...selectedStates, name], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeState = (name: string) => {
    setValue(
      "selectedStates",
      selectedStates.filter((s) => s !== name),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const addCity = (name: string) => {
    if (selectedCities.includes(name)) return;
    if (selectedCities.length >= LOCATION_LIMIT) return;
    setValue("selectedCities", [...selectedCities, name], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeCity = (name: string) => {
    setValue(
      "selectedCities",
      selectedCities.filter((c) => c !== name),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const updatePayRange = (next: { min: number; max: number }) => {
    if (!selectedCountryName || !payRow) return;
    setValue(
      "payRangeFilter",
      {
        ...payRangeFilter,
        [selectedCountryName]: {
          ...payRow,
          min: next.min,
          max: next.max,
        },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const roleKind = title.toLowerCase().includes("onsite") ? "onsite" : "hybrid";

  const headerCount =
    searchMode === "state"
      ? `${selectedStates.length}/${LOCATION_LIMIT} states`
      : searchMode === "city"
        ? `${selectedCities.length}/${LOCATION_LIMIT} cities`
        : "0 locations";

  return (
    <div
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
          <p className="text-sm font-semibold">{title}</p>
        </div>
        {selectedCountryName ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {headerCount}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="hybrid-country" className="text-xs font-medium">
            Country <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Country is required. Search and select your country first.
          </p>
          <LocationSearchCombobox
            id="hybrid-country"
            placeholder="Search countries..."
            options={countryOptions}
            value={selectedCountryName || null}
            onValueChange={setCountry}
          />
        </div>

        {selectedCountryName ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm">
            <span aria-hidden>{countryMeta?.flag ?? "🌐"}</span>
            <span>{selectedCountryName}</span>
          </span>
        ) : null}

        {selectedCountryName && searchMode === null ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Search within a state/province, or go straight to cities?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => chooseSearchMode("state")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  "border-border bg-card text-foreground hover:bg-muted/80",
                )}
              >
                <span aria-hidden>🗺️</span>
                By state / province
              </button>
              <button
                type="button"
                onClick={() => chooseSearchMode("city")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  "border-border bg-card text-foreground hover:bg-muted/80",
                )}
              >
                <span aria-hidden>🏙️</span>
                By city
              </button>
            </div>
          </div>
        ) : null}

        {selectedCountryName && searchMode !== null ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {searchMode === "state" ? (
                <>
                  Searching by{" "}
                  <span className="font-medium text-foreground">
                    state / province
                  </span>{" "}
                  for {roleKind} roles — add up to {LOCATION_LIMIT} states.
                </>
              ) : (
                <>
                  Searching by{" "}
                  <span className="font-medium text-foreground">city</span> for{" "}
                  {roleKind} roles — add up to {LOCATION_LIMIT} cities.
                </>
              )}
            </p>

            {searchMode === "state" ? (
              <div className="space-y-1.5">
                <Label htmlFor="hybrid-state" className="text-xs font-medium">
                  State / Province
                </Label>
                <LocationSearchCombobox
                  id="hybrid-state"
                  placeholder="Search states..."
                  options={stateOptions}
                  value={null}
                  onValueChange={addState}
                  disabled={atStateCap}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="hybrid-city" className="text-xs font-medium">
                  City
                </Label>
                <LocationSearchCombobox
                  id="hybrid-city"
                  placeholder="Search cities..."
                  resolveOptions={resolveCountryCityOptions}
                  value={null}
                  onValueChange={addCity}
                  disabled={atCityCap}
                  emptyHint="Type to search cities across this country."
                />
              </div>
            )}

            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={resetSearchMode}
            >
              ← Change search type
            </button>

            {searchMode === "state" && atStateCap ? (
              <p className="text-xs text-muted-foreground">
                Maximum {LOCATION_LIMIT} states — remove one to add another.
              </p>
            ) : null}
            {searchMode === "city" && atCityCap ? (
              <p className="text-xs text-muted-foreground">
                Maximum {LOCATION_LIMIT} cities — remove one to add another.
              </p>
            ) : null}

            {searchMode === "state" && selectedStates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedStates.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm"
                  >
                    <span aria-hidden>{countryMeta?.flag ?? "📍"}</span>
                    <span>{name}</span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="size-4 rounded-full"
                      onClick={() => removeState(name)}
                      aria-label={`Remove state ${name}`}
                    >
                      ×
                    </Button>
                  </span>
                ))}
              </div>
            ) : null}

            {searchMode === "city" && selectedCities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedCities.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm"
                  >
                    <span aria-hidden>{countryMeta?.flag ?? "📍"}</span>
                    <span>{name}</span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="size-4 rounded-full"
                      onClick={() => removeCity(name)}
                      aria-label={`Remove city ${name}`}
                    >
                      ×
                    </Button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {(errors.selectedRegions?.message ||
          errors.selectedStates?.message ||
          errors.selectedCities?.message) && (
          <p className="text-xs text-destructive">
            {errors.selectedRegions?.message ??
              errors.selectedStates?.message ??
              errors.selectedCities?.message}
          </p>
        )}

        {errors.payRangeFilter &&
        typeof errors.payRangeFilter === "object" &&
        "message" in errors.payRangeFilter &&
        typeof errors.payRangeFilter.message === "string" ? (
          <p className="text-xs text-destructive">{errors.payRangeFilter.message}</p>
        ) : null}

        {selectedCountryName && payRow ? (
          <div className="border-t border-border pt-4">
            <RegionPayRangeCard
              region={selectedCountryName}
              flag={countryMeta?.flag}
              row={payRow}
              errors={errors}
              onRangeChange={updatePayRange}
              onRemove={clearCountry}
              idPrefix="hybrid-pay"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
