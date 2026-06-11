import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const password = "ZxqP76m4eid4gF2H";
  const ref = "ukgolkaejlfhcqhudmve";

  // Test multiple connection formats
  const urls = [
    {
      name: "direct-6543",
      url: `postgresql://postgres:${password}@db.${ref}.supabase.co:6543/postgres`,
    },
    {
      name: "direct-5432",
      url: `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`,
    },
    {
      name: "pooler-sg-6543",
      url: `postgresql://postgres.${ref}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    },
    {
      name: "pooler-sg-5432",
      url: `postgresql://postgres.${ref}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    },
    {
      name: "pooler-us-6543",
      url: `postgresql://postgres.${ref}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    },
    {
      name: "supavisor-6543",
      url: `postgresql://postgres.${ref}:${password}@${ref}.pooler.supabase.com:6543/postgres`,
    },
    {
      name: "supavisor-5432",
      url: `postgresql://postgres.${ref}:${password}@${ref}.pooler.supabase.com:5432/postgres`,
    },
  ];

  const results: Array<{ name: string; status: string; detail?: string }> = [];

  for (const { name, url } of urls) {
    try {
      const sql = postgres(url, {
        prepare: false,
        connect_timeout: 8,
        idle_timeout: 5,
        max: 1,
      });
      const rows = await sql`SELECT 1 as ok`;
      await sql.end();
      results.push({ name, status: "SUCCESS", detail: `Connected! rows=${rows.length}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name, status: "FAILED", detail: msg.slice(0, 150) });
    }
  }

  return NextResponse.json({ results });
}
