import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { TRUST_RULES as R } from "@/lib/release-quality";

/**
 * Release 1 trust gate: keep bad actors out of matching (see TRUST_RULES).
 * Nothing here is a permanent ban — a paused account is excluded until an
 * admin reviews it.
 */

type Row = Record<string, unknown>;
const rows = async (q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as Row[];

/**
 * Approved providers offering `category` who pass the trust gate for this
 * customer, best first (rating, then review count).
 */
export async function eligibleProviders(category: string, customerId: string) {
  const r = await rows(sql`
    WITH recent AS (
      SELECT provider_id, rating,
        ROW_NUMBER() OVER (PARTITION BY provider_id ORDER BY created_at DESC) AS rn
      FROM reviews
      WHERE status = 'published' AND direction = 'customer_to_provider'
    ),
    stats AS (
      SELECT provider_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS n
      FROM recent WHERE rn <= ${R.lastN} GROUP BY provider_id
    )
    SELECT pp.id, pp.user_id, pp.service_radius_km AS radius, u.name, u.email,
      COALESCE(s.avg_rating, 0) AS avg_rating, COALESCE(s.n, 0) AS review_count
    FROM provider_profiles pp
    JOIN provider_categories pc ON pc.provider_id = pp.id AND pc.category = ${category}
    LEFT JOIN users u ON u.id = pp.user_id
    LEFT JOIN stats s ON s.provider_id = pp.id
    WHERE pp.onboarding_status = 'approved'
      -- background check: approved, current police check + ID
      AND (
        SELECT COUNT(DISTINCT d.type) FROM provider_documents d
        WHERE d.provider_id = pp.id AND d.status = 'approved'
          AND d.type::text IN ('police_check', 'identity')
          AND (
            d.expires_at > NOW()
            OR (d.expires_at IS NULL AND COALESCE(d.reviewed_at, d.created_at) > NOW() - make_interval(years => ${R.policeCheckValidYears}))
          )
      ) = ${R.requiredDocs.length}
      -- low rating
      AND NOT (COALESCE(s.n, 0) >= ${R.minReviews} AND s.avg_rating < ${R.providerMinAvg})
      -- repeated self-cancellations
      AND (
        SELECT COUNT(*) FROM cancellations c JOIN bookings b ON b.id = c.booking_id
        WHERE b.provider_id = pp.id AND c.cancelled_by = pp.user_id
          AND c.created_at > NOW() - INTERVAL '90 days'
      ) < ${R.maxCancels90d}
      -- quality-control flags (short visits etc.)
      AND (
        SELECT COUNT(*) FROM bookings b
        WHERE b.provider_id = pp.id AND b.qc_flag IS NOT NULL
          AND b.completed_at > NOW() - INTERVAL '90 days'
      ) < ${R.maxQcFlags90d}
      -- pair blocked: either side rated the other <= pairBlockAt
      AND NOT EXISTS (
        SELECT 1 FROM reviews rv
        WHERE rv.provider_id = pp.id AND rv.customer_id = ${customerId}
          AND rv.rating <= ${R.pairBlockAt}
      )
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT 50`);
  return r.map((x) => ({
    id: String(x.id),
    userId: String(x.user_id),
    radius: Number(x.radius ?? 0),
    providerName: (x.name as string | null) ?? null,
    providerEmail: (x.email as string | null) ?? null,
    avgRating: Number(x.avg_rating),
    reviewCount: Number(x.review_count),
  }));
}

/** Is this provider still eligible for this customer? (re-checked at booking time) */
export async function isProviderEligible(providerId: string, category: string, customerId: string) {
  return (await eligibleProviders(category, customerId)).some((p) => p.id === providerId);
}

/** Why a customer can't book right now, or null. */
export async function customerPauseReason(customerId: string): Promise<"low_rating" | "cancellations" | null> {
  const [stats] = await rows(sql`
    SELECT AVG(rating)::float AS avg_rating, COUNT(*)::int AS n FROM (
      SELECT rating FROM reviews
      WHERE customer_id = ${customerId} AND direction = 'provider_to_customer' AND status = 'published'
      ORDER BY created_at DESC LIMIT ${R.lastN}
    ) t`);
  if (Number(stats?.n ?? 0) >= R.minReviews && Number(stats?.avg_rating) < R.customerMinAvg) return "low_rating";
  const [late] = await rows(sql`
    SELECT COUNT(*)::int AS n FROM cancellations c JOIN bookings b ON b.id = c.booking_id
    WHERE b.customer_id = ${customerId} AND c.cancelled_by = ${customerId}
      AND (c.policy_applied LIKE '<%' OR c.policy_applied LIKE '%no_show%')
      AND c.created_at > NOW() - INTERVAL '90 days'`);
  if (Number(late?.n ?? 0) >= R.maxCancels90d) return "cancellations";
  return null;
}

/** Providers currently paused by the trust gate, with the reason — admin review queue. */
export async function pausedProviders() {
  return rows(sql`
    WITH recent AS (
      SELECT provider_id, rating,
        ROW_NUMBER() OVER (PARTITION BY provider_id ORDER BY created_at DESC) AS rn
      FROM reviews WHERE status = 'published' AND direction = 'customer_to_provider'
    ),
    stats AS (
      SELECT provider_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS n
      FROM recent WHERE rn <= ${R.lastN} GROUP BY provider_id
    ),
    p AS (
      SELECT pp.id, u.name, u.email,
        COALESCE(s.avg_rating, 0) AS avg_rating, COALESCE(s.n, 0) AS review_count,
        (SELECT COUNT(*)::int FROM cancellations c JOIN bookings b ON b.id = c.booking_id
          WHERE b.provider_id = pp.id AND c.cancelled_by = pp.user_id
            AND c.created_at > NOW() - INTERVAL '90 days') AS cancels_90d,
        (SELECT COUNT(*)::int FROM bookings b
          WHERE b.provider_id = pp.id AND b.qc_flag IS NOT NULL
            AND b.completed_at > NOW() - INTERVAL '90 days') AS qc_flags_90d,
        (SELECT COUNT(DISTINCT d.type)::int FROM provider_documents d
          WHERE d.provider_id = pp.id AND d.status = 'approved'
            AND d.type::text IN ('police_check', 'identity')
            AND (d.expires_at > NOW()
              OR (d.expires_at IS NULL AND COALESCE(d.reviewed_at, d.created_at) > NOW() - make_interval(years => ${R.policeCheckValidYears})))
        ) AS current_checks
      FROM provider_profiles pp
      LEFT JOIN users u ON u.id = pp.user_id
      LEFT JOIN stats s ON s.provider_id = pp.id
      WHERE pp.onboarding_status = 'approved'
    )
    SELECT * FROM p
    WHERE (review_count >= ${R.minReviews} AND avg_rating < ${R.providerMinAvg})
       OR cancels_90d >= ${R.maxCancels90d}
       OR qc_flags_90d >= ${R.maxQcFlags90d}
       OR current_checks < ${R.requiredDocs.length}
    ORDER BY avg_rating ASC`);
}

/** Customers currently paused from booking, with the reason. */
export async function pausedCustomers() {
  return rows(sql`
    WITH stats AS (
      SELECT customer_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS n
      FROM (
        SELECT customer_id, rating,
          ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
        FROM reviews WHERE direction = 'provider_to_customer' AND status = 'published'
      ) t WHERE rn <= ${R.lastN} GROUP BY customer_id
    ),
    late AS (
      SELECT b.customer_id, COUNT(*)::int AS n FROM cancellations c JOIN bookings b ON b.id = c.booking_id
      WHERE c.cancelled_by = b.customer_id
        AND (c.policy_applied LIKE '<%' OR c.policy_applied LIKE '%no_show%')
        AND c.created_at > NOW() - INTERVAL '90 days'
      GROUP BY b.customer_id
    )
    SELECT u.id, u.name, u.email, COALESCE(s.avg_rating, 0) AS avg_rating, COALESCE(s.n, 0) AS review_count,
      COALESCE(l.n, 0) AS late_cancels_90d
    FROM users u
    LEFT JOIN stats s ON s.customer_id = u.id
    LEFT JOIN late l ON l.customer_id = u.id
    WHERE (COALESCE(s.n, 0) >= ${R.minReviews} AND s.avg_rating < ${R.customerMinAvg})
       OR COALESCE(l.n, 0) >= ${R.maxCancels90d}`);
}

/** Completed jobs whose payout is held: QC flag or a <= 2★ customer rating. */
export async function heldPayouts() {
  return rows(sql`
    SELECT b.id, b.qc_flag, b.completed_at, b.total_price, b.currency, b.effort_tier,
      s.category_code AS category, cu.name AS customer_name, pu.name AS provider_name,
      r.rating AS customer_rating, r.comment AS customer_comment,
      (SELECT COUNT(*)::int FROM booking_evidence e WHERE e.booking_id = b.id AND e.phase = 'before') AS before_n,
      (SELECT COUNT(*)::int FROM booking_evidence e WHERE e.booking_id = b.id AND e.phase = 'after') AS after_n
    FROM bookings b
    LEFT JOIN services s ON s.id = b.service_id
    LEFT JOIN users cu ON cu.id = b.customer_id
    LEFT JOIN provider_profiles pp ON pp.id = b.provider_id
    LEFT JOIN users pu ON pu.id = pp.user_id
    LEFT JOIN reviews r ON r.booking_id = b.id AND r.direction = 'customer_to_provider'
    WHERE b.status = 'completed'
      AND (b.qc_flag IS NOT NULL OR r.rating <= ${R.pairBlockAt})
    ORDER BY b.completed_at DESC
    LIMIT 100`);
}
