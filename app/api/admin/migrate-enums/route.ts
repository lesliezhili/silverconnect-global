import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.SESSION_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Add missing enum values
    const countryValues = ["US", "TW", "SG", "HK", "MY"];
    for (const v of countryValues) {
      await sql.unsafe(`ALTER TYPE country ADD VALUE IF NOT EXISTS '${v}'`);
    }

    const localeValues = ["zh_tw", "ja", "ko", "th"];
    for (const v of localeValues) {
      await sql.unsafe(`ALTER TYPE locale ADD VALUE IF NOT EXISTS '${v}'`);
    }

    await sql.end();
    return NextResponse.json({ success: true, added: { countries: countryValues, locales: localeValues } });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
