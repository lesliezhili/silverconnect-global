import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/regions — List countries/regions
 *   ?country=AU|NZ — specific country config
 *   (no params) — list all supported countries
 * 
 * POST /api/regions — Set user's country preference
 *   Body: { userId, country: "AU"|"NZ", region? }
 */
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");

  const COUNTRIES = {
    AU: { code: "AU", name: "Australia", currency: "AUD", taxRate: 0.10, taxName: "GST", timezone: "Australia/Sydney", phonePrefix: "+61", regions: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"] },
    NZ: { code: "NZ", name: "New Zealand", currency: "NZD", taxRate: 0.15, taxName: "GST", timezone: "Pacific/Auckland", phonePrefix: "+64", regions: ["Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty", "Otago", "Hawkes Bay", "Taranaki", "Northland", "Southland", "Nelson", "Marlborough"] },
  };

  if (country && COUNTRIES[country as keyof typeof COUNTRIES]) {
    return NextResponse.json({ success: true, country: COUNTRIES[country as keyof typeof COUNTRIES] });
  }

  return NextResponse.json({ success: true, countries: Object.values(COUNTRIES), supported: ["AU", "NZ"] });
}

export async function POST(req: NextRequest) {
  const { userId, country, region } = await req.json();
  if (!userId || !country) return NextResponse.json({ error: "userId, country required" }, { status: 400 });
  if (!["AU", "NZ"].includes(country)) return NextResponse.json({ error: "country must be AU or NZ" }, { status: 400 });

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    // Store preference in platform_settings or user metadata
    await sql`INSERT INTO platform_settings (key, value, updated_at) VALUES (${'user_country_' + userId}, ${JSON.stringify({ country, region })}, NOW()) ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify({ country, region })}, updated_at = NOW()`;
    await sql.end();
    return NextResponse.json({ success: true, userId, country, region, currency: country === "NZ" ? "NZD" : "AUD", taxRate: country === "NZ" ? 0.15 : 0.10 });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
