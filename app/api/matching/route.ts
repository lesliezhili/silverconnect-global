import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/matching — Smart provider-consumer matching
 * Body: { customerId, serviceCategory, latitude, longitude, scheduledAt, preferredProvider?, maxDistanceKm? }
 * 
 * Scoring algorithm:
 * - Distance (40%): closer = higher score, within service_radius_km
 * - Rating (25%): average review rating
 * - Price (20%): competitive pricing relative to category average
 * - Availability (15%): fewer bookings on requested day = more available
 * 
 * Returns top 5 matched providers ranked by composite score.
 */
export async function POST(req: NextRequest) {
  const { customerId, serviceCategory, latitude, longitude, scheduledAt, preferredProvider, maxDistanceKm = 25 } = await req.json();
  if (!serviceCategory || latitude === undefined || longitude === undefined) {
    return NextResponse.json({ error: "serviceCategory, latitude, longitude required" }, { status: 400 });
  }
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    // Get all approved providers with location data
    const providers = await sql`
      SELECT pp.id as provider_id, pp.user_id, u.name, u.email, pp.service_radius_km, pp.bio, pp.address_line,
        COALESCE(pp.service_radius_km, 15) as radius
      FROM provider_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.onboarding_status = 'approved'
    `;

    // Get provider ratings
    const ratings = await sql`
      SELECT provider_id, AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as review_count
      FROM reviews WHERE status = 'approved' OR status IS NULL
      GROUP BY provider_id
    `;
    const ratingMap: Record<string, { avg: number; count: number }> = {};
    for (const r of ratings) { ratingMap[r.provider_id] = { avg: parseFloat(r.avg_rating) || 0, count: parseInt(r.review_count) || 0 }; }

    // Get provider pricing for this category
    const pricing = await sql`
      SELECT provider_id, rate_per_hour FROM service_pricing WHERE category_code = ${serviceCategory}
    `;
    const priceMap: Record<string, number> = {};
    let avgPrice = 0;
    for (const p of pricing) { priceMap[p.provider_id] = parseFloat(p.rate_per_hour); avgPrice += parseFloat(p.rate_per_hour); }
    avgPrice = pricing.length > 0 ? avgPrice / pricing.length : 50;

    // Get scheduled day bookings (for availability scoring)
    const schedDate = scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const dayBookings = await sql`
      SELECT provider_id, COUNT(*) as booking_count FROM bookings
      WHERE scheduled_at::date = ${schedDate}::date AND status NOT IN ('cancelled')
      GROUP BY provider_id
    `;
    const loadMap: Record<string, number> = {};
    for (const b of dayBookings) { loadMap[b.provider_id] = parseInt(b.booking_count); }

    // Provider locations (from recent GPS data or address geocode)
    const locations = await sql`
      SELECT DISTINCT ON (provider_id) provider_id, latitude, longitude
      FROM provider_locations WHERE sharing_enabled = true
      ORDER BY provider_id, updated_at DESC
    `.catch(() => []);
    const locMap: Record<string, { lat: number; lng: number }> = {};
    for (const l of locations) { locMap[l.provider_id] = { lat: parseFloat(l.latitude), lng: parseFloat(l.longitude) }; }

    // Haversine distance calculation
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Score each provider
    const scored = providers.map((p) => {
      const loc = locMap[p.provider_id];
      // Distance score (40%) — use provider location or default to 5km
      const distance = loc ? haversine(latitude, longitude, loc.lat, loc.lng) : 5;
      const distScore = distance <= maxDistanceKm ? Math.max(0, 1 - distance / maxDistanceKm) : 0;

      // Rating score (25%)
      const rating = ratingMap[p.provider_id] || { avg: 3.5, count: 0 };
      const rateScore = (rating.avg / 5) * (Math.min(rating.count, 10) / 10 * 0.5 + 0.5); // weighted by count

      // Price score (20%) — cheaper than avg = better
      const price = priceMap[p.provider_id] || avgPrice;
      const priceScore = avgPrice > 0 ? Math.max(0, Math.min(1, 1 - (price - avgPrice * 0.7) / (avgPrice * 0.6))) : 0.5;

      // Availability score (15%) — fewer bookings = more available
      const load = loadMap[p.provider_id] || 0;
      const availScore = Math.max(0, 1 - load / 6); // max 6 bookings/day

      // Preferred provider bonus
      const prefBonus = preferredProvider && p.provider_id === preferredProvider ? 0.15 : 0;

      const composite = (distScore * 0.40) + (rateScore * 0.25) + (priceScore * 0.20) + (availScore * 0.15) + prefBonus;

      return {
        providerId: p.provider_id,
        userId: p.user_id,
        name: p.name,
        bio: p.bio,
        distance: Math.round(distance * 10) / 10,
        rating: rating.avg,
        reviewCount: rating.count,
        pricePerHour: price,
        dayBookings: load,
        score: Math.round(composite * 100) / 100,
        breakdown: { distance: Math.round(distScore * 100), rating: Math.round(rateScore * 100), price: Math.round(priceScore * 100), availability: Math.round(availScore * 100) },
        withinRadius: distance <= (p.radius || 15),
      };
    }).filter(p => p.score > 0 && p.withinRadius).sort((a, b) => b.score - a.score).slice(0, 5);

    await sql.end();
    return NextResponse.json({
      success: true,
      matches: scored,
      meta: { totalProviders: providers.length, matchedProviders: scored.length, serviceCategory, maxDistance: maxDistanceKm, weights: { distance: "40%", rating: "25%", price: "20%", availability: "15%" } },
    });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}

/** GET /api/matching?providerId=xxx — Get provider's matching profile (tools, skills, coverage) */
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    const [profile] = await sql`SELECT pp.*, u.name, u.email FROM provider_profiles pp JOIN users u ON pp.user_id = u.id WHERE pp.id = ${providerId}`;
    const ratings = await sql`SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE provider_id = ${providerId}`;
    const pricing = await sql`SELECT category_code, rate_per_hour FROM service_pricing WHERE provider_id = ${providerId}`;
    const recentBookings = await sql`SELECT COUNT(*) as count FROM bookings WHERE provider_id = ${providerId} AND status = 'completed' AND completed_at > NOW() - INTERVAL '30 days'`;
    await sql.end();
    return NextResponse.json({
      success: true,
      provider: { id: profile?.id, name: profile?.name, bio: profile?.bio, serviceRadius: profile?.service_radius_km, rating: ratings[0]?.avg_rating ? parseFloat(ratings[0].avg_rating) : null, reviewCount: parseInt(ratings[0]?.count) || 0, pricing: pricing.map(p => ({ category: p.category_code, rate: parseFloat(p.rate_per_hour) })), completedLast30d: parseInt(recentBookings[0]?.count) || 0 },
    });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
