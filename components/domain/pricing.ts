import type { CountryCode } from "@/components/layout";
import { CURRENCY_SYMBOL } from "@/components/domain/country";

/**
 * Format a numeric AUD price into the user's display currency. US gets an
 * approximate 0.65x conversion (rough AUD→USD); AU and CA use the value as-is.
 * Real FX wiring is deferred until billing/payouts go live.
 */
export function priceCountry(country: CountryCode, value: number): string {
  const sym = CURRENCY_SYMBOL[country];
  const v = country === "US" ? value * 0.65 : value;
  return `${sym}${v.toFixed(0)}`;
}
