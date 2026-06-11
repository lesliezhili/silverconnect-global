import { NextResponse } from "next/server";
import postgres from "postgres";
import { createPgClient } from "@/lib/db/pg-connection";

export const dynamic = "force-dynamic";

/** Smart Search: ranks by distance(40%) + quality(35%) + price(15%) + reliability(10%) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "cleaning";
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const country = searchParams.get("country") || "AU";
  const sortBy = searchParams.get("sort") || "smart";

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = createPgClient(url, 3);

  try {
    // Get approved providers for this category
    const providers = await sql`
      SELECT pp.id as provider_id, pp.user_id, pp.bio, pp.address_line,
        pp.service_lat, pp.service_lng, pp.service_radius_km,
        u.full_name, u.name, u.avatar_url
      FROM provider_profiles pp
      INNER JOIN provider_categories pc ON pc.provider_id = pp.id
      INNER JOIN users u ON u.id = pp.user_id
      WHERE pc.category = ${category}::service_category
        AND pp.onboarding_status = 'approved'
    `;

    // Get pricing for this category and country
    const prices = await sql`
      SELECT s.code, sp.base_price
      FROM services s
      INNER JOIN service_prices sp ON sp.service_id = s.id
      WHERE s.category_code = ${category} AND sp.country = ${country}::country
    `;
    const mktAvg = prices.length > 0
      ? prices.reduce((s: number, p: any) => s + Number(p.base_price), 0) / prices.length
      : 50;

    if (providers.length === 0) {
      await sql.end();
      return NextResponse.json({ results: [], meta: { total: 0, category, country, avgMarketPrice: Math.round(mktAvg), sortBy } });
    }

    // Get review averages
    const reviews = await sql`
      SELECT provider_id, AVG(rating)::float as avg_rating, COUNT(*)::int as review_count
      FROM reviews GROUP BY provider_id
    `;
    const rMap = new Map(reviews.map((r: any) => [r.provider_id, { avg: r.avg_rating, cnt: r.review_count }]));

    // Score providers
    const scored = providers.map((p: any) => {
      const pLat = Number(p.service_lat) || 0;
      const pLng = Number(p.service_lng) || 0;
      const rad = Number(p.service_radius_km) || 10;
      const dLat = (lat - pLat) * Math.PI / 180;
      const dLng = (lng - pLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(pLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distScore = Math.max(0, 1 - km / rad);
      const rt = rMap.get(p.provider_id) as { avg: number; cnt: number } | undefined;
      const qualityScore = rt ? rt.avg / 5 : 0.6;
      const smartScore = distScore * 0.4 + qualityScore * 0.35 + 0.7 * 0.15 + 0.8 * 0.1;
      return {
        id: p.provider_id, userId: p.user_id,
        name: p.full_name || p.name || "Provider",
        bio: p.bio, address: p.address_line,
        distanceKm: Math.round(km * 10) / 10,
        rating: rt?.avg ?? 0, reviewCount: rt?.cnt ?? 0,
        avatarUrl: p.avatar_url, smartScore: Math.round(smartScore * 100) / 100,
        priceFrom: mktAvg,
      };
    });

    await sql.end();

    // Sort
    const out = [...scored];
    if (sortBy === "price") out.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sortBy === "rating") out.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "distance") out.sort((a, b) => a.distanceKm - b.distanceKm);
    else out.sort((a, b) => b.smartScore - a.smartScore);

    return NextResponse.json({
      results: (lat === 0 && lng === 0) ? out : out.filter((p) => p.distanceKm <= 50),
      meta: { total: out.length, category, country, avgMarketPrice: Math.round(mktAvg), sortBy },
    });
  } catch (e: unknown) {
    try { await sql.end(); } catch {}
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
