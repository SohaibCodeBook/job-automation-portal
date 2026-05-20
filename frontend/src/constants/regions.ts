import { Country } from "country-state-city";

import {
  getAllCountries,
  getCurrencyForCountryName,
} from "@/lib/locations";

export type RemoteRegionPickerOption = {
  regionValue: string;
  displayLabel: string;
  libraryName: string;
  flag: string;
  isoCode: string;
  currency: string;
};

let cachedPickerOptions: RemoteRegionPickerOption[] | null = null;

/** All countries available for remote salary region selection. */
export function getRemoteRegionPickerOptions(): RemoteRegionPickerOption[] {
  if (cachedPickerOptions) return cachedPickerOptions;

  cachedPickerOptions = getAllCountries().map((country) => {
    const lib = Country.getCountryByCode(country.code);
    const currency =
      getCurrencyForCountryName(country.name) ??
      lib?.currency.trim().toUpperCase() ??
      "USD";
    return {
      regionValue: country.name,
      displayLabel: country.name,
      libraryName: country.name,
      flag: lib?.flag ?? "🌐",
      isoCode: country.code,
      currency,
    };
  });

  return cachedPickerOptions;
}

export function getRemoteRegionPickerOption(
  regionValue: string,
): RemoteRegionPickerOption | undefined {
  return getRemoteRegionPickerOptions().find(
    (opt) => opt.regionValue === regionValue,
  );
}

const CURRENCY_DISPLAY: Record<string, { symbol: string; compact: string }> = {
  USD: { symbol: "$", compact: "$" },
  GBP: { symbol: "£", compact: "£" },
  AUD: { symbol: "A$", compact: "A$" },
  CAD: { symbol: "C$", compact: "C$" },
  EUR: { symbol: "€", compact: "€" },
  AED: { symbol: "د.إ", compact: "AED " },
  INR: { symbol: "₹", compact: "₹" },
  SGD: { symbol: "S$", compact: "S$" },
  PKR: { symbol: "₨", compact: "₨" },
  JPY: { symbol: "¥", compact: "¥" },
  CHF: { symbol: "Fr", compact: "CHF " },
  CNY: { symbol: "¥", compact: "¥" },
  BRL: { symbol: "R$", compact: "R$" },
  MXN: { symbol: "$", compact: "MX$" },
  ZAR: { symbol: "R", compact: "R" },
  KRW: { symbol: "₩", compact: "₩" },
  SEK: { symbol: "kr", compact: "kr" },
  NOK: { symbol: "kr", compact: "kr" },
  DKK: { symbol: "kr", compact: "kr" },
  PLN: { symbol: "zł", compact: "zł" },
  TRY: { symbol: "₺", compact: "₺" },
  THB: { symbol: "฿", compact: "฿" },
  IDR: { symbol: "Rp", compact: "Rp" },
  PHP: { symbol: "₱", compact: "₱" },
  VND: { symbol: "₫", compact: "₫" },
  NZD: { symbol: "NZ$", compact: "NZ$" },
  HKD: { symbol: "HK$", compact: "HK$" },
  TWD: { symbol: "NT$", compact: "NT$" },
  SAR: { symbol: "﷼", compact: "SAR " },
  ILS: { symbol: "₪", compact: "₪" },
  ARS: { symbol: "$", compact: "AR$" },
  CLP: { symbol: "$", compact: "CL$" },
  COP: { symbol: "$", compact: "CO$" },
};

export function currencyBadgeLabel(currencyCode: string): string {
  const u = currencyCode.toUpperCase();
  const d = CURRENCY_DISPLAY[u];
  if (!d) return `${u}`;
  return `${u} ${d.symbol}`;
}

/** Slider domain (annual salary numbers). Same scale for all regions for UX simplicity. */
export const PAY_RANGE_TRACK_MIN = 30_000;
export const PAY_RANGE_TRACK_MAX = 300_000;
export const PAY_RANGE_STEP = 1_000;

export const DEFAULT_REGION_PAY_MIN = 60_000;
export const DEFAULT_REGION_PAY_MAX = 180_000;

export type RegionPayRangeEntry = {
  min: number;
  max: number;
  currency: string;
};

export function getCurrencyForRegion(region: string): string {
  const code = getCurrencyForCountryName(region);
  if (!code) {
    throw new Error(`Unknown country for currency mapping: ${region}`);
  }
  return code;
}

export function formatCompactSalary(amount: number, currencyCode: string): string {
  const u = currencyCode.toUpperCase();
  const disp = CURRENCY_DISPLAY[u]?.compact ?? `${u} `;
  if (amount >= 1_000_000) {
    return `${disp}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${disp}${Math.round(amount / 1000)}K`;
  }
  return `${disp}${amount}`;
}

export function defaultPayRangeForRegion(region: string): RegionPayRangeEntry {
  return {
    min: DEFAULT_REGION_PAY_MIN,
    max: DEFAULT_REGION_PAY_MAX,
    currency: getCurrencyForRegion(region),
  };
}

export function syncPayRangeFilterWithRegions(
  previous: Record<string, RegionPayRangeEntry>,
  regions: string[],
): Record<string, RegionPayRangeEntry> {
  const next: Record<string, RegionPayRangeEntry> = {};
  for (const region of regions) {
    const currency = getCurrencyForCountryName(region);
    if (!currency) continue;
    const existing = previous[region];
    if (existing && existing.currency === currency) {
      let min = Math.max(PAY_RANGE_TRACK_MIN, existing.min);
      let max = Math.min(PAY_RANGE_TRACK_MAX, existing.max);
      if (min > max) {
        min = DEFAULT_REGION_PAY_MIN;
        max = DEFAULT_REGION_PAY_MAX;
      }
      next[region] = { min, max, currency };
    } else {
      next[region] = defaultPayRangeForRegion(region);
    }
  }
  return next;
}
