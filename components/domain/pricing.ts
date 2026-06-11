import type { CountryCode } from "@/components/layout";
import { CURRENCY_SYMBOL } from "@/components/domain/country";

/**
 * Format a numeric AUD price into the user's display currency. CN gets a
 * flat 8x conversion (rough AUD→CNY); AU and CA use the value as-is.
 * Real FX wiring is deferred until billing/payouts go live.
 */
export function priceCountry(country: CountryCode, value: number): string {
  const sym = CURRENCY_SYMBOL[country];
  const v = country === "CN" ? value * 8 : value;
  return `${sym}${v.toFixed(0)}`;
}
