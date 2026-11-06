import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceQuotes } from "@/lib/db/schema/bookings";
import { findLiveArea, isReleaseCategory, isReleaseCountry, type LiveArea, type ReleaseCategory } from "@/lib/release";
import { isEffortTier, priceFor, type EffortTier } from "@/lib/release-pricing";

/** An approved, unexpired quote for this customer + provider + category. */
export async function approvedQuote(customerId: string, providerId: string, category: string) {
  const [q] = await db
    .select()
    .from(serviceQuotes)
    .where(
      and(
        eq(serviceQuotes.customerId, customerId),
        eq(serviceQuotes.providerId, providerId),
        eq(serviceQuotes.category, category),
        eq(serviceQuotes.status, "approved"),
        gt(serviceQuotes.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return q ?? null;
}

export interface ReleasePrice {
  area: LiveArea;
  tier: EffortTier;
  hours: number;
  hourly: number;
  base: number;
  tax: number;
  total: number;
  taxLabel: string;
  currency: string;
  /** Set when an approved quote changed the tier / hours. */
  quoteId: string | null;
}

/**
 * The one place a Release 1 booking is priced: standard tier model, the
 * address's live area for tax, and an approved quote from this provider if
 * there is one. Returns null when the booking is outside Release 1.
 */
export async function priceReleaseBooking(input: {
  customerId: string;
  providerId: string | null;
  category: string | undefined;
  tier: string | undefined;
  address: { country: string; postcode: string | null } | null;
}): Promise<ReleasePrice | null> {
  const { category, tier, address } = input;
  if (!address || !isReleaseCategory(category) || !isEffortTier(tier) || !isReleaseCountry(address.country)) return null;
  const area = findLiveArea(address.country, address.postcode);
  if (!area) return null;

  let useTier: EffortTier = tier;
  let hours: number | undefined;
  let quoteId: string | null = null;
  if (input.providerId) {
    const q = await approvedQuote(input.customerId, input.providerId, category);
    if (q && isEffortTier(q.tier)) {
      useTier = q.tier;
      hours = Number(q.hours);
      quoteId = q.id;
    }
  }
  const p = priceFor({ country: area.country, category: category as ReleaseCategory, tier: useTier, hours, taxRate: area.tax.rate });
  return {
    area,
    tier: useTier,
    ...p,
    taxLabel: `${area.tax.abbr} ${Math.round(area.tax.rate * 100)}%`,
    currency: area.country === "CA" ? "CAD" : "AUD",
    quoteId,
  };
}
