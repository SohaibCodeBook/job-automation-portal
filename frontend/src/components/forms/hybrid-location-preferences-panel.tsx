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
  getCitiesByState,
  getStatesByCountry,
} from "@/lib/locations";
import { cn } from "@/lib/utils";
import type { JobSearchFormValues } from "@/types/job-search-form";

const CITY_LIMIT = 3 as const;

type HybridLocationPreferencesPanelProps = {
  title?: string;
  setValue: UseFormSetValue<JobSearchFormValues>;
  watch: UseFormWatch<JobSearchFormValues>;
  errors: FieldErrors<JobSearchFormValues>;
};

function countryFlag(code: string): string {
  return Country.getCountryByCode(code)?.flag ?? "🌐";
}

export function HybridLocationPreferencesPanel({
  title = "Hybrid Location Preferences",
  setValue,
  watch,
  errors,
}: HybridLocationPreferencesPanelProps) {
  const selectedCountryName = watch("selectedRegions")?.[0] ?? "";
  const selectedStateName = watch("selectedStates")?.[0] ?? "";
  const selectedCities = watch("selectedCities") ?? [];
  const payRangeFilter = watch("payRangeFilter") ?? {};

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

  const stateCode = React.useMemo(() => {
    if (!countryCode || !selectedStateName) return "";
    return (
      getStatesByCountry(countryCode).find((s) => s.name === selectedStateName)
        ?.code ?? ""
    );
  }, [countryCode, selectedStateName]);

  const stateOptions = React.useMemo((): LocationSearchOption[] => {
    if (!countryCode) return [];
    return getStatesByCountry(countryCode).map((state) => ({
      value: state.name,
      label: state.name,
      subLabel: selectedCountryName,
    }));
  }, [countryCode, selectedCountryName]);

  const cityOptions = React.useMemo((): LocationSearchOption[] => {
    if (!countryCode || !stateCode) return [];
    return getCitiesByState(countryCode, stateCode)
      .filter((city) => !selectedCities.includes(city.name))
      .map((city) => ({
        value: city.name,
        label: city.name,
        subLabel: selectedStateName,
      }));
  }, [countryCode, stateCode, selectedStateName, selectedCities]);

  const atCityCap = selectedCities.length >= CITY_LIMIT;
  const countryMeta = selectedCountryName
    ? getRemoteRegionPickerOption(selectedCountryName)
    : undefined;
  const payRow = selectedCountryName
    ? payRangeFilter[selectedCountryName]
    : undefined;

  const setCountry = (name: string) => {
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
    setValue("selectedRegions", [], { shouldDirty: true, shouldValidate: true });
    setValue("payRangeFilter", {}, { shouldDirty: true, shouldValidate: true });
    setValue("selectedStates", [], { shouldDirty: true, shouldValidate: true });
    setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
  };

  const setState = (name: string) => {
    setValue("selectedStates", [name], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("selectedCities", [], { shouldDirty: true, shouldValidate: true });
  };

  const addCity = (name: string) => {
    if (selectedCities.includes(name)) return;
    if (selectedCities.length >= CITY_LIMIT) return;
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
        <span className="text-xs tabular-nums text-muted-foreground">
          {selectedCities.length}/{CITY_LIMIT} cities
        </span>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Select a <span className="font-medium text-foreground">country</span>,
          then a <span className="font-medium text-foreground">state or province</span>,
          then add up to {CITY_LIMIT} cities.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="hybrid-country" className="text-xs font-medium">
              Country
            </Label>
            <LocationSearchCombobox
              id="hybrid-country"
              placeholder="Search countries..."
              options={countryOptions}
              value={selectedCountryName || null}
              onValueChange={setCountry}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hybrid-state" className="text-xs font-medium">
              State / Province
            </Label>
            <LocationSearchCombobox
              id="hybrid-state"
              placeholder="Search states..."
              options={stateOptions}
              value={selectedStateName || null}
              onValueChange={setState}
              disabled={!countryCode}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hybrid-city" className="text-xs font-medium">
              City
            </Label>
            <LocationSearchCombobox
              id="hybrid-city"
              placeholder="Search cities..."
              options={cityOptions}
              value={null}
              onValueChange={addCity}
              disabled={!stateCode || atCityCap}
            />
          </div>
        </div>

        {atCityCap ? (
          <p className="text-xs text-muted-foreground">
            Maximum {CITY_LIMIT} cities — remove one to add another.
          </p>
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

        {selectedCities.length > 0 ? (
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
