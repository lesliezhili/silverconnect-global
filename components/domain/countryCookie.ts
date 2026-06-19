import { cookies } from "next/headers";
import type { CountryCode } from "@/components/layout";
import { COUNTRIES } from "./country";

export const COUNTRY_COOKIE = "sc-country";
export const DEFAULT_COUNTRY: CountryCode = "AU";

/** Server-side read of the country preference cookie. */
// No cookie: locale-based default (zh->CN, zh_tw->TW, rest->AU)
const LOCALE_DEFAULT_COUNTRY: Record<string,string> = { zh:'CN', zh_tw:'TW' }

export async function getCountry(locale?: string): Promise<CountryCode> {
  const store = await cookies();
  const raw = store.get(COUNTRY_COOKIE)?.value;
  if (raw && (COUNTRIES as readonly string[]).includes(raw)) {
    return raw as CountryCode;
  }
  return DEFAULT_COUNTRY;
}
