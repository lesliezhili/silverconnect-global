import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isEffortTier, type EffortTier } from "@/lib/release-pricing";

/**
 * Booking preferences learned from two-way feedback (Release 1):
 *  - suggested tier: the latest "next visit should be…" for this customer
 *    and service, from the customer's own feedback or their helper's;
 *  - preferred helpers: ones the customer rated ≥ 4★, or favourited.
 * (A ≤ 2★ rating either way blocks the pair entirely — lib/trust.ts.)
 */

type Row = Record<string, unknown>;
const rows = async (q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as Row[];

export const PREFERRED_MIN_RATING = 4;

export async function suggestedTier(
  customerId: string,
  category: string,
): Promise<{ tier: EffortTier; by: "provider" | "customer"; providerName: string | null } | null> {
  const [r] = await rows(sql`
    SELECT r.suggested_tier, r.direction, u.name AS provider_name
    FROM reviews r
    JOIN bookings b ON b.id = r.booking_id
    JOIN services s ON s.id = b.service_id
    LEFT JOIN provider_profiles pp ON pp.id = r.provider_id
    LEFT JOIN users u ON u.id = pp.user_id
    WHERE r.customer_id = ${customerId}
      AND s.category_code = ${category}
      AND r.suggested_tier IS NOT NULL
    ORDER BY r.created_at DESC
    LIMIT 1`);
  if (!r || !isEffortTier(r.suggested_tier)) return null;
  return {
    tier: r.suggested_tier,
    by: r.direction === "provider_to_customer" ? "provider" : "customer",
    providerName: (r.provider_name as string | null) ?? null,
  };
}

export interface HelperPreference {
  /** The customer's latest rating of this helper (any service). */
  rated: number | null;
  favourite: boolean;
}

export async function helperPreferences(customerId: string): Promise<Map<string, HelperPreference>> {
  const out = new Map<string, HelperPreference>();
  const rated = await rows(sql`
    SELECT DISTINCT ON (provider_id) provider_id, rating
    FROM reviews
    WHERE customer_id = ${customerId} AND direction = 'customer_to_provider' AND status = 'published'
    ORDER BY provider_id, created_at DESC`);
  for (const r of rated) out.set(String(r.provider_id), { rated: Number(r.rating), favourite: false });
  const favs = await rows(sql`SELECT provider_id FROM favourites WHERE user_id = ${customerId}`);
  for (const f of favs) {
    const id = String(f.provider_id);
    out.set(id, { rated: out.get(id)?.rated ?? null, favourite: true });
  }
  return out;
}

/** Preferred first (higher own rating, then favourites); otherwise keep the trust order. */
export function sortByPreference<T extends { id: string }>(list: T[], prefs: Map<string, HelperPreference>): T[] {
  const score = (id: string) => {
    const p = prefs.get(id);
    if (!p) return 0;
    const rated = p.rated !== null && p.rated >= PREFERRED_MIN_RATING ? 10 + p.rated : 0;
    return rated + (p.favourite ? 5 : 0);
  };
  return list
    .map((x, i) => ({ x, i, s: score(x.id) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(({ x }) => x);
}
