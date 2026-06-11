import type { CountryCode } from "@/components/layout";
export type { CountryCode };

export const COUNTRIES: readonly CountryCode[] = ["AU", "CN", "CA", "US", "TW", "SG", "HK", "MY"] as const;

export const CURRENCY_SYMBOL: Record<CountryCode, string> = {
  AU: "A$",
  CN: "¥",
  CA: "C$",
  US: "$",
  TW: "NT$",
  SG: "S$",
  HK: "HK$",
  MY: "RM",
};

export const TAX_ABBR: Record<CountryCode, string> = {
  AU: "GST",
  CN: "VAT",
  CA: "HST",
  US: "Tax",
  TW: "VAT",
  SG: "GST",
  HK: "",
  MY: "SST",
};

export const TAX_RATE: Record<CountryCode, number> = {
  AU: 0.10,
  CN: 0.06,
  CA: 0.13,
  US: 0.0825,
  TW: 0.05,
  SG: 0.09,
  HK: 0.00,
  MY: 0.06,
};

export const EMERGENCY_NUMBER: Record<CountryCode, string> = {
  AU: "000",
  CN: "120",
  CA: "911",
  US: "911",
  TW: "119",
  SG: "995",
  HK: "999",
  MY: "999",
};


/**
 * Country-specific brand name.
 * China market uses 九鼎银联 (9tripod Silver Connect — non-profit mutual aid).
 */
export const BRAND_NAME: Record<CountryCode, string> = {
  AU: "SilverConnect",
  CN: "九鼎银联",
  CA: "SilverConnect",
  US: "SilverConnect",
  TW: "SilverConnect",
  SG: "SilverConnect",
  HK: "SilverConnect",
  MY: "SilverConnect",
};

export const BRAND_TAGLINE: Record<CountryCode, string> = {
  AU: "Trusted home services for older adults",
  CN: "值得信赖的长者居家服务",
  CA: "Trusted home services for older adults",
  US: "Trusted home services for older adults",
  TW: "值得信賴的長者居家服務",
  SG: "Trusted home services for older adults",
  HK: "值得信賴的長者居家服務",
  MY: "Trusted home services for older adults",
};

/**
 * Format a price in the current country's currency.
 */
export function fmtPrice(country: CountryCode, base: number, fractionDigits = 2): string {
  const value = base;
  const fixed = value.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${CURRENCY_SYMBOL[country]}${fixed}`;
}

export function fmtPriceRange(country: CountryCode, lo: number, hi: number): string {
  return `${CURRENCY_SYMBOL[country]}${lo}–${hi}`;
}
