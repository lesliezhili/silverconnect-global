import type { CountryCode } from "@/components/layout";

export const COUNTRIES: readonly CountryCode[] = ["AU", "US", "CA"] as const;

export const CURRENCY_SYMBOL: Record<CountryCode, string> = {
  AU: "A$",
  US: "US$",
  CA: "C$",
};

export const TAX_ABBR: Record<CountryCode, "GST" | "Sales Tax" | "HST"> = {
  AU: "GST",
  US: "Sales Tax",
  CA: "HST",
};

export const TAX_RATE: Record<CountryCode, number> = {
  AU: 0.1,
  US: 0.08,
  CA: 0.13,
};

export const EMERGENCY_NUMBER: Record<CountryCode, string> = {
  AU: "000",
  US: "911",
  CA: "911",
};

const US_RATE = 0.65;

/**
 * Format a price in the current country's currency.
 * Base value is in AUD; US uses an approximate AUD→USD FX rate for display only —
 * real multi-currency settlement is deferred to billing/payouts.
 */
export function fmtPrice(country: CountryCode, base: number, fractionDigits = 2): string {
  const value = country === "US" ? base * US_RATE : base;
  const fixed = value.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${CURRENCY_SYMBOL[country]}${fixed}`;
}

export function fmtPriceRange(country: CountryCode, lo: number, hi: number): string {
  return country === "US"
    ? `${CURRENCY_SYMBOL.US}${(lo * US_RATE).toFixed(0)}–${(hi * US_RATE).toFixed(0)}`
    : `${CURRENCY_SYMBOL[country]}${lo}–${hi}`;
}
