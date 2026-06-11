/**
 * SilverConnect Global — Multi-country configuration
 * Supports: Australia (AU) + New Zealand (NZ)
 */

export type CountryCode = "AU" | "NZ";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxName: string;
  taxRegistration: string;
  timezone: string;
  phonePrefix: string;
  emergencyNumber: string;
  defaultLocale: string;
  supportedLocales: string[];
  bankFeeRate: number;
  bankFeeFixed: number;
  regions: string[];
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "$",
    taxRate: 0.10,
    taxName: "GST",
    taxRegistration: "ABN",
    timezone: "Australia/Sydney",
    phonePrefix: "+61",
    emergencyNumber: "000",
    defaultLocale: "en",
    supportedLocales: ["en", "zh", "zh_tw", "th", "ko", "ja", "vi"],
    bankFeeRate: 0.017,
    bankFeeFixed: 0.30,
    regions: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"],
  },
  NZ: {
    code: "NZ",
    name: "New Zealand",
    currency: "NZD",
    currencySymbol: "$",
    taxRate: 0.15,
    taxName: "GST",
    taxRegistration: "NZBN",
    timezone: "Pacific/Auckland",
    phonePrefix: "+64",
    emergencyNumber: "111",
    defaultLocale: "en",
    supportedLocales: ["en", "zh", "zh_tw", "ko", "ja"],
    bankFeeRate: 0.017,
    bankFeeFixed: 0.30,
    regions: ["Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty", "Manawatu-Wanganui", "Otago", "Hawkes Bay", "Taranaki", "Northland", "Southland", "Nelson", "Marlborough", "Gisborne", "West Coast", "Tasman"],
  },
};

export function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRIES[code];
}

export function getDefaultCountry(): CountryCode {
  return "AU";
}

export function calculateTax(basePrice: number, country: CountryCode): { taxAmount: number; taxRate: number; taxName: string } {
  const config = COUNTRIES[country];
  const taxAmount = Math.round(basePrice * config.taxRate * 100) / 100;
  return { taxAmount, taxRate: config.taxRate, taxName: config.taxName };
}

export function calculateBankFee(totalAmount: number, country: CountryCode, platformTier: "standard" | "premium" | "free"): number {
  if (platformTier === "free") return 0;
  const config = COUNTRIES[country];
  return Math.round((totalAmount * config.bankFeeRate + config.bankFeeFixed) * 100) / 100;
}

export function formatCurrency(amount: number, country: CountryCode): string {
  const config = COUNTRIES[country];
  return `${config.currencySymbol}${amount.toFixed(2)} ${config.currency}`;
}

export const NZ_SERVICES = {
  cleaning: { baseRate: 45, name: "Home Cleaning" },
  garden: { baseRate: 55, name: "Garden & Lawn" },
  repair: { baseRate: 70, name: "Home Repairs" },
  personalCare: { baseRate: 50, name: "Personal Care" },
  companion: { baseRate: 38, name: "Companionship" },
  transport: { baseRate: 42, name: "Transport" },
  itSupport: { baseRate: 60, name: "IT Support" },
};

export const AU_SERVICES = {
  cleaning: { baseRate: 50, name: "Home Cleaning" },
  garden: { baseRate: 50, name: "Garden & Lawn" },
  repair: { baseRate: 65, name: "Home Repairs" },
  personalCare: { baseRate: 55, name: "Personal Care" },
  companion: { baseRate: 40, name: "Companionship" },
  transport: { baseRate: 45, name: "Transport" },
  itSupport: { baseRate: 65, name: "IT Support" },
};
