/**
 * Release 1 scope — the single source of truth for what is publicly
 * bookable right now.
 *
 * Release 1: home cleaning, garden care and no-licence handyman jobs
 * for Chinese-speaking older adults (华人长者), Australia and Canada
 * only. Live first in Melbourne's and Vancouver's Chinese communities;
 * other major communities (Sydney, Brisbane, Toronto, …) are on a
 * waitlist (NEXT_AREAS) until added to LIVE_AREAS.
 *
 * Everything else in the codebase (other categories, CN/US/… countries,
 * day-care centres) stays built but hidden from customer-facing pages
 * and rejected by the booking API.
 */
import type { CountryCode } from "@/components/domain/country";

export const RELEASE_ID = "r1";

export const RELEASE_COUNTRIES = ["AU", "CA"] as const satisfies readonly CountryCode[];
export type ReleaseCountry = (typeof RELEASE_COUNTRIES)[number];

export const RELEASE_CATEGORIES = ["cleaning", "garden", "repair"] as const;
export type ReleaseCategory = (typeof RELEASE_CATEGORIES)[number];

/**
 * Sub-types a booking may name. "repair" is handyman work that needs no
 * trade licence: electrical, plumbing and gas work are licensed in both
 * VIC and BC, and VIC domestic building work over A$10,000 needs a
 * registered builder, so they're excluded. Tree
 * felling and gutter cleaning (ladders / heights) are also left out of
 * R1 as a safety risk for unlicensed providers.
 */
export const RELEASE_SUBTYPES: Record<ReleaseCategory, readonly string[]> = {
  cleaning: ["regular", "medium", "deep", "external"],
  garden: [],
  repair: ["furniture", "hanging", "door", "window", "curtain", "small_fix"],
};

/** Handyman jobs above this (labour + materials) need a registered builder in VIC. */
export const HANDYMAN_JOB_CAP = 10_000;

/**
 * Built but not part of Release 1. Kept in the codebase as reference for
 * later releases (see docs/FUTURE_RELEASES.md); the proxy sends visitors
 * to /coming-soon instead. Paths are without the locale prefix.
 */
export const FUTURE_ROUTES: readonly string[] = [
  // Faith & emotional-care programmes
  "/christian", "/devotional", "/book-faith", "/xinyuzhe", "/biography",
  "/provider/register-faith", "/provider/faith-info", "/provider/faith-schedule",
  "/provider/complete-faith", "/provider/prayer-report", "/provider/prayer-reports",
  // Other customer features
  "/donate", "/products", "/nearby", "/country-services", "/family",
  "/customer/membership", "/profile/coins", "/profile/referrals", "/profile/funding",
  "/bookings/recurring",
  // Legacy booking flows — Release 1 books only through /bookings/new
  "/book", "/book-service",
  // Care facilities & certified care
  "/register/day-care-centre", "/register/certification", "/provider/licenses",
  // Provider extras
  "/provider/guaranteed-wage", "/provider/leaderboard", "/provider/achievements",
  "/provider/goals", "/provider/team-chat", "/provider/smart-pricing",
  "/provider/seniors", "/provider/training",
  // Internal / demo
  "/test-sos", "/dev",
];

export function isFutureRoute(pathWithoutLocale: string): boolean {
  return FUTURE_ROUTES.some((r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(r + "/"));
}

export function isReleaseSubtype(category: string, subtype: string | null | undefined): boolean {
  if (!isReleaseCategory(category)) return false;
  const allowed = RELEASE_SUBTYPES[category];
  if (!subtype) return category !== "repair"; // handyman must say what job
  return allowed.includes(subtype);
}

export interface LiveArea {
  country: ReleaseCountry;
  city: string;
  cityZh: string;
  state: string;
  /** Tax charged on bookings here (CA varies by province). */
  tax: { abbr: string; rate: number };
  /** Chinese-community neighbourhoods we name in launch copy. */
  hubs: readonly { en: string; zh: string }[];
  /** AU: inclusive numeric postcode ranges. */
  postcodes?: readonly [number, number][];
  /** CA: forward sortation areas (first 3 chars of the postal code). */
  fsas?: readonly string[];
}

/**
 * Live now — the major Chinese communities of the launch city in each
 * market. Widen as provider coverage grows.
 */
export const LIVE_AREAS: readonly LiveArea[] = [
  {
    country: "AU",
    city: "Melbourne",
    cityZh: "墨尔本",
    state: "VIC",
    tax: { abbr: "GST", rate: 0.1 },
    hubs: [
      { en: "Box Hill", zh: "博士山" },
      { en: "Doncaster", zh: "唐卡斯特" },
      { en: "Glen Waverley", zh: "威佛利山" },
      { en: "Balwyn", zh: "巴尔温" },
      { en: "Kew", zh: "邱区" },
      { en: "Toorak", zh: "图拉克" },
      { en: "Clayton", zh: "克莱顿" },
      { en: "CBD", zh: "市中心" },
    ],
    postcodes: [
      [3000, 3006], // CBD, Southbank, Docklands, East Melbourne
      [3030, 3030], // Point Cook / Werribee
      [3053, 3053], // Carlton
      [3101, 3109], // Kew, Balwyn, Bulleen, Templestowe, Doncaster
      [3122, 3130], // Hawthorn, Camberwell, Burwood, Box Hill, Blackburn
      [3141, 3151], // South Yarra, Toorak, Malvern, Glen Iris, Ashburton, Glen/Mount Waverley, Burwood East
      [3166, 3172], // Oakleigh, Clayton, Springvale
    ],
  },
  {
    country: "CA",
    city: "Vancouver",
    cityZh: "温哥华",
    state: "BC",
    // Home cleaning / garden / handyman services: 5% GST, no BC PST.
    tax: { abbr: "GST", rate: 0.05 },
    hubs: [
      { en: "Richmond", zh: "列治文" },
      { en: "Burnaby", zh: "本拿比" },
      { en: "Vancouver", zh: "温哥华" },
      { en: "Coquitlam", zh: "高贵林" },
    ],
    fsas: [
      // Richmond
      "V6V", "V6W", "V6X", "V6Y", "V7A", "V7C", "V7E",
      // Burnaby
      "V5A", "V5B", "V5C", "V5E", "V5G", "V5H", "V5J",
      // City of Vancouver
      "V5K", "V5L", "V5M", "V5N", "V5P", "V5R", "V5S", "V5T", "V5V", "V5W", "V5X", "V5Y", "V5Z",
      "V6A", "V6B", "V6C", "V6E", "V6G", "V6H", "V6J", "V6K", "V6L", "V6M", "V6N", "V6P", "V6R", "V6S", "V6T", "V6Z",
      // Coquitlam / Port Moody
      "V3B", "V3C", "V3E", "V3H", "V3J", "V3K",
    ],
  },
];

/** Shown as "coming next" (waitlist) — the other major Chinese communities. */
export const NEXT_AREAS: readonly { country: ReleaseCountry; en: string; zh: string }[] = [
  { country: "AU", en: "Sydney (Chatswood, Hurstville, Eastwood, Burwood)", zh: "悉尼（车士活、好市维、伊斯特伍德、宝活）" },
  { country: "AU", en: "Brisbane (Sunnybank)", zh: "布里斯班（新柏）" },
  { country: "AU", en: "Perth", zh: "珀斯" },
  { country: "AU", en: "Adelaide", zh: "阿德莱德" },
  { country: "CA", en: "Toronto (Markham, Richmond Hill, Scarborough)", zh: "多伦多（万锦、列治文山、士嘉堡）" },
  { country: "CA", en: "Calgary", zh: "卡尔加里" },
  { country: "CA", en: "Montreal", zh: "蒙特利尔" },
];

export function isReleaseCountry(code: string | null | undefined): code is ReleaseCountry {
  return !!code && (RELEASE_COUNTRIES as readonly string[]).includes(code);
}

export function isReleaseCategory(code: string | null | undefined): code is ReleaseCategory {
  return !!code && (RELEASE_CATEGORIES as readonly string[]).includes(code);
}

export function liveAreasFor(country: string): readonly LiveArea[] {
  return LIVE_AREAS.filter((a) => a.country === country);
}

/** True once at least one city in this country accepts bookings. */
export function isCountryLive(country: string): boolean {
  return liveAreasFor(country).length > 0;
}

/** The live area serving this postcode, or null (→ waitlist). */
export function findLiveArea(country: string, postcode: string | number | null | undefined): LiveArea | null {
  const raw = String(postcode ?? "").replace(/\s+/g, "").toUpperCase();
  if (!raw) return null;
  const n = /^\d{4}$/.test(raw) ? parseInt(raw, 10) : NaN;
  const fsa = /^[A-Z]\d[A-Z]/.test(raw) ? raw.slice(0, 3) : "";
  return (
    liveAreasFor(country).find(
      (a) =>
        (Number.isFinite(n) && a.postcodes?.some(([lo, hi]) => n >= lo && n <= hi)) ||
        (!!fsa && a.fsas?.includes(fsa)),
    ) ?? null
  );
}
