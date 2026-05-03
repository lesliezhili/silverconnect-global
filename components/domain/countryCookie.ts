import { cookies } from "next/headers";
import type { CountryCode } from "@/components/layout";
import { COUNTRIES } from "./country";

export const COUNTRY_COOKIE = "sc-country";
export const DEFAULT_COUNTRY: CountryCode = "AU";

/** Server-side read of the country preference cookie. */
export async function getCountry(): Promise<CountryCode> {
  const store = await cookies();
  const raw = store.get(COUNTRY_COOKIE)?.value;
  if (raw && (COUNTRIES as readonly string[]).includes(raw)) {
    return raw as CountryCode;
  }
  return DEFAULT_COUNTRY;
}
