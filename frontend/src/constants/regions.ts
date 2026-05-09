/**
 * Remote salary regions — labels must match backend exactly.
 */
export const REMOTE_REGION_DEFINITIONS = [
  { label: "United States", value: "United States", flag: "🇺🇸" },
  { label: "United Kingdom", value: "United Kingdom", flag: "🇬🇧" },
  { label: "Australia", value: "Australia", flag: "🇦🇺" },
  { label: "Canada", value: "Canada", flag: "🇨🇦" },
  { label: "Germany", value: "Germany", flag: "🇩🇪" },
  { label: "Netherlands", value: "Netherlands", flag: "🇳🇱" },
  { label: "UAE", value: "UAE", flag: "🇦🇪" },
  { label: "India", value: "India", flag: "🇮🇳" },
  { label: "Singapore", value: "Singapore", flag: "🇸🇬" },
  { label: "Pakistan", value: "Pakistan", flag: "🇵🇰" },
  { label: "Ireland", value: "Ireland", flag: "🇮🇪" },
  { label: "France", value: "France", flag: "🇫🇷" },
] as const;

export type RemoteRegionValue = (typeof REMOTE_REGION_DEFINITIONS)[number]["value"];

/** ISO 4217 — must stay aligned with backend region→currency mapping. */
export const REGION_TO_CURRENCY: Record<RemoteRegionValue, string> = {
  "United States": "USD",
  "United Kingdom": "GBP",
  Australia: "AUD",
  Canada: "CAD",
  Germany: "EUR",
  Netherlands: "EUR",
  UAE: "AED",
  India: "INR",
  Singapore: "SGD",
  Pakistan: "PKR",
  Ireland: "EUR",
  France: "EUR",
};

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
  const code = REGION_TO_CURRENCY[region as RemoteRegionValue];
  if (!code) {
    throw new Error(`Unknown region for currency mapping: ${region}`);
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

export function defaultPayRangeForRegion(region: RemoteRegionValue): RegionPayRangeEntry {
  return {
    min: DEFAULT_REGION_PAY_MIN,
    max: DEFAULT_REGION_PAY_MAX,
    currency: REGION_TO_CURRENCY[region],
  };
}

export function syncPayRangeFilterWithRegions(
  previous: Record<string, RegionPayRangeEntry>,
  regions: string[],
): Record<string, RegionPayRangeEntry> {
  const next: Record<string, RegionPayRangeEntry> = {};
  for (const region of regions) {
    if (!(region in REGION_TO_CURRENCY)) continue;
    const key = region as RemoteRegionValue;
    const existing = previous[region];
    const currency = REGION_TO_CURRENCY[key];
    if (existing && existing.currency === currency) {
      let min = Math.max(PAY_RANGE_TRACK_MIN, existing.min);
      let max = Math.min(PAY_RANGE_TRACK_MAX, existing.max);
      if (min > max) {
        min = DEFAULT_REGION_PAY_MIN;
        max = DEFAULT_REGION_PAY_MAX;
      }
      next[region] = { min, max, currency };
    } else {
      next[region] = defaultPayRangeForRegion(key);
    }
  }
  return next;
}
