import type { CountryCode } from "@/components/layout";

export const COUNTRIES: readonly CountryCode[] = ["AU", "CN", "CA"] as const;

export const CURRENCY_SYMBOL: Record<CountryCode, string> = {
  AU: "A$",
  CN: "¥",
  CA: "C$",
};

export const TAX_ABBR: Record<CountryCode, "GST" | "VAT" | "HST"> = {
  AU: "GST",
  CN: "VAT",
  CA: "HST",
};

export const TAX_RATE: Record<CountryCode, number> = {
  AU: 0.1,
  CN: 0.06,
  CA: 0.13,
};

export const EMERGENCY_NUMBER: Record<CountryCode, string> = {
  AU: "000",
  CN: "120",
  CA: "911",
};

const CN_RATE = 8;

/**
 * Format a price in the current country's currency.
 * AU/CA price is base * 1; CN price is base * 8 (rough AUD→CNY rate as in design).
 */
export function fmtPrice(country: CountryCode, base: number, fractionDigits = 2): string {
  const value = country === "CN" ? base * CN_RATE : base;
  const fixed = value.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${CURRENCY_SYMBOL[country]}${fixed}`;
}

export function fmtPriceRange(country: CountryCode, lo: number, hi: number): string {
  return country === "CN"
    ? `${CURRENCY_SYMBOL.CN}${lo * CN_RATE}–${hi * CN_RATE}`
    : `${CURRENCY_SYMBOL[country]}${lo}–${hi}`;
}
