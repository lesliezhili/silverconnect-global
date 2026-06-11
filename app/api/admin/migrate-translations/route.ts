import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/migrate-translations
 * Creates translation tables if they don't exist.
 */
export async function POST() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  const results: string[] = [];
  try {
    // Service category translations
    await sql`CREATE TABLE IF NOT EXISTS service_category_translations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      category_code TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en',
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(category_code, locale)
    )`;
    results.push("service_category_translations: OK");

    // Service translations
    await sql`CREATE TABLE IF NOT EXISTS service_translations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      service_code TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en',
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(service_code, locale)
    )`;
    results.push("service_translations: OK");

    // Service pricing (if not exists)
    await sql`CREATE TABLE IF NOT EXISTS service_pricing (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      service_id UUID NOT NULL,
      country_code TEXT NOT NULL DEFAULT 'AU',
      base_rate_per_hour NUMERIC(10,2) DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'AUD',
      tax_rate NUMERIC(5,4) DEFAULT 0,
      total_price TEXT DEFAULT '0.00',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(service_id, country_code)
    )`;
    results.push("service_pricing: OK");

    // Provider notes (for faith volunteer metadata)
    await sql`ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS notes TEXT`;
    results.push("provider_profiles.notes column: OK");

    // Devotional bookmarks (user can save favorites)
    await sql`CREATE TABLE IF NOT EXISTS devotional_bookmarks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      devotional_key TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, devotional_key)
    )`;
    results.push("devotional_bookmarks: OK");

    await sql.end();
    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), partialResults: results }, { status: 500 });
  }
}
