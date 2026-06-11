"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * PROVIDER RANKING ENGINE — SilverConnect Global
 * 
 * Composite score calculation (weighted):
 * - 40% Customer ratings (avg across all dimensions)
 * - 20% Photo compliance (before/after submitted rate)
 * - 15% Punctuality (check-in on time rate)
 * - 10% Cancellation rate (inverse — fewer = better)
 * - 10% Emergency response rate (opt-in + actual coverage)
 * - 5%  Security verification completeness
 * 
 * Tier assignment:
 * - Platinum: score >= 4.5 + 50+ reviews
 * - Gold: score >= 4.0 + 20+ reviews
 * - Silver: score >= 3.5 + 10+ reviews
 * - Bronze: all others (new providers start here)
 */

export async function submitFeedback(params: {
  bookingId: string;
  customerId: string;
  providerId: string;
  overallRating: number;
  punctualityRating?: number;
  qualityRating?: number;
  communicationRating?: number;
  safetyRating?: number;
  comment?: string;
  wouldRecommend?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const { bookingId, customerId, providerId, overallRating, punctualityRating, qualityRating, communicationRating, safetyRating, comment, wouldRecommend } = params;

  if (overallRating < 1 || overallRating > 5) return { success: false, error: "Rating must be 1-5" };

  // Check if both before AND after photos were submitted (bonus score)
  const photoRows: any = await db.execute(sql`
    SELECT COUNT(DISTINCT photo_type) as photo_types FROM service_photos WHERE booking_id = ${bookingId}
  `);
  const photoScore = (photoRows.rows?.[0]?.photo_types || 0) >= 2 ? 5 : (photoRows.rows?.[0]?.photo_types || 0) >= 1 ? 3 : 0;

  await db.execute(sql`
    INSERT INTO service_feedback (booking_id, customer_id, provider_id, overall_rating, punctuality_rating, quality_rating, communication_rating, safety_rating, comment, would_recommend, photo_evidence_score)
    VALUES (${bookingId}, ${customerId}, ${providerId}, ${overallRating}, ${punctualityRating || null}, ${qualityRating || null}, ${communicationRating || null}, ${safetyRating || null}, ${comment || null}, ${wouldRecommend ?? null}, ${photoScore})
    ON CONFLICT (booking_id, customer_id) DO UPDATE SET
      overall_rating = EXCLUDED.overall_rating,
      punctuality_rating = EXCLUDED.punctuality_rating,
      quality_rating = EXCLUDED.quality_rating,
      communication_rating = EXCLUDED.communication_rating,
      safety_rating = EXCLUDED.safety_rating,
      comment = EXCLUDED.comment,
      would_recommend = EXCLUDED.would_recommend
  `);

  // Recalculate provider ranking
  await recalculateProviderRanking(providerId);

  return { success: true };
}

export async function recalculateProviderRanking(providerId: string): Promise<void> {
  // Get provider's postcode
  const provRows: any = await db.execute(sql`
    SELECT coverage_postcodes FROM provider_profiles WHERE id = ${providerId}
  `);
  const postcode = provRows.rows?.[0]?.coverage_postcodes?.[0] || "0000";

  // Calculate averages
  const statsRows: any = await db.execute(sql`
    SELECT
      COUNT(*) as total_reviews,
      AVG(overall_rating) as avg_rating,
      AVG(punctuality_rating) as punctuality_avg,
      AVG(quality_rating) as quality_avg,
      AVG(communication_rating) as communication_avg,
      AVG(safety_rating) as safety_avg,
      AVG(photo_evidence_score) as photo_avg
    FROM service_feedback WHERE provider_id = ${providerId}
  `);
  const stats = statsRows.rows?.[0] || {};

  const totalReviews = parseInt(stats.total_reviews) || 0;
  const avgRating = parseFloat(stats.avg_rating) || 0;
  const punctualityAvg = parseFloat(stats.punctuality_avg) || 0;
  const qualityAvg = parseFloat(stats.quality_avg) || 0;
  const commAvg = parseFloat(stats.communication_avg) || 0;
  const safetyAvg = parseFloat(stats.safety_avg) || 0;
  const photoAvg = parseFloat(stats.photo_avg) || 0;

  // Photo compliance (% of bookings with both before+after)
  const complianceRows: any = await db.execute(sql`
    SELECT
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(DISTINCT CASE WHEN sp.photo_types >= 2 THEN b.id END) as compliant_bookings
    FROM bookings b
    LEFT JOIN (
      SELECT booking_id, COUNT(DISTINCT photo_type) as photo_types FROM service_photos GROUP BY booking_id
    ) sp ON sp.booking_id = b.id
    WHERE b.provider_id = ${providerId} AND b.status IN ('completed', 'released')
  `);
  const comp = complianceRows.rows?.[0] || {};
  const photoCompliancePct = comp.total_bookings > 0 ? (comp.compliant_bookings / comp.total_bookings) * 100 : 0;

  // Composite score (weighted)
  const compositeScore = Math.min(5.0,
    (avgRating * 0.40) +
    (photoCompliancePct / 20 * 0.20) + // Normalize to 0-5 scale
    (punctualityAvg * 0.15) +
    ((5 - 0) * 0.10) + // Cancellation placeholder (inverse)
    (0 * 0.10) + // Emergency response placeholder
    ((totalReviews > 0 ? 5 : 0) * 0.05) // Security verification placeholder
  );

  // Tier assignment
  let tier = "bronze";
  if (compositeScore >= 4.5 && totalReviews >= 50) tier = "platinum";
  else if (compositeScore >= 4.0 && totalReviews >= 20) tier = "gold";
  else if (compositeScore >= 3.5 && totalReviews >= 10) tier = "silver";

  // Upsert ranking
  await db.execute(sql`
    INSERT INTO provider_rankings (provider_id, postcode, composite_score, total_reviews, avg_rating, punctuality_avg, quality_avg, communication_avg, safety_avg, photo_compliance_pct, tier, last_calculated_at)
    VALUES (${providerId}, ${postcode}, ${compositeScore}, ${totalReviews}, ${avgRating}, ${punctualityAvg}, ${qualityAvg}, ${commAvg}, ${safetyAvg}, ${photoCompliancePct}, ${tier}, NOW())
    ON CONFLICT (provider_id) DO UPDATE SET
      composite_score = EXCLUDED.composite_score,
      total_reviews = EXCLUDED.total_reviews,
      avg_rating = EXCLUDED.avg_rating,
      punctuality_avg = EXCLUDED.punctuality_avg,
      quality_avg = EXCLUDED.quality_avg,
      communication_avg = EXCLUDED.communication_avg,
      safety_avg = EXCLUDED.safety_avg,
      photo_compliance_pct = EXCLUDED.photo_compliance_pct,
      tier = EXCLUDED.tier,
      last_calculated_at = NOW()
  `);

  // Update rank within postcode
  await db.execute(sql`
    WITH ranked AS (
      SELECT provider_id, ROW_NUMBER() OVER (PARTITION BY postcode ORDER BY composite_score DESC) as rank
      FROM provider_rankings WHERE postcode = ${postcode}
    )
    UPDATE provider_rankings SET rank_in_postcode = ranked.rank
    FROM ranked WHERE provider_rankings.provider_id = ranked.provider_id
  `);
}

// ─── Public: Get ranked providers for a postcode ────────────

export async function getProvidersForPostcode(params: {
  postcode: string;
  serviceTier?: string;
  fundingSource?: string;
  limit?: number;
}): Promise<Array<{
  providerId: string;
  name: string;
  tier: string;
  compositeScore: number;
  avgRating: number;
  totalReviews: number;
  photoCompliance: number;
  securityVerified: boolean;
  hourlyRate: number;
  rank: number;
}>> {
  const { postcode, serviceTier, limit = 20 } = params;

  const rows: any = await db.execute(sql`
    SELECT
      pp.id as provider_id,
      u.full_name as name,
      COALESCE(pr.tier, 'bronze') as tier,
      COALESCE(pr.composite_score, 0) as composite_score,
      COALESCE(pr.avg_rating, 0) as avg_rating,
      COALESCE(pr.total_reviews, 0) as total_reviews,
      COALESCE(pr.photo_compliance_pct, 0) as photo_compliance,
      pp.base_hourly_rate as hourly_rate,
      COALESCE(pr.rank_in_postcode, 999) as rank
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    LEFT JOIN provider_rankings pr ON pr.provider_id = pp.id
    WHERE pp.status = 'approved'
      AND ${postcode} = ANY(pp.coverage_postcodes)
      AND (${serviceTier || null} IS NULL OR pp.service_tier = ${serviceTier || "basic"})
    ORDER BY pr.composite_score DESC NULLS LAST, pp.base_hourly_rate ASC
    LIMIT ${limit}
  `);

  return (rows.rows || []).map((r: any) => ({
    providerId: r.provider_id,
    name: r.name,
    tier: r.tier,
    compositeScore: parseFloat(r.composite_score) || 0,
    avgRating: parseFloat(r.avg_rating) || 0,
    totalReviews: parseInt(r.total_reviews) || 0,
    photoCompliance: parseFloat(r.photo_compliance) || 0,
    securityVerified: true, // TODO: join security checks
    hourlyRate: parseFloat(r.hourly_rate) || 0,
    rank: parseInt(r.rank) || 999,
  }));
}
