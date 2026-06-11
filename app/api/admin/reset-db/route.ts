import { NextResponse } from "next/server";
import postgres from "postgres";

const SECRET = process.env.SESSION_SECRET;

export async function POST(req: Request) {
  // Simple auth check
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Step 1: Drop all tables
    const tables = await sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    for (const { tablename } of tables) {
      await sql.unsafe(`DROP TABLE IF EXISTS public."${tablename}" CASCADE`);
    }

    // Step 2: Drop all custom types/enums
    const types = await sql`
      SELECT typname FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `;
    for (const { typname } of types) {
      await sql.unsafe(`DROP TYPE IF EXISTS public."${typname}" CASCADE`);
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      dropped: { tables: tables.length, types: types.length },
      message: "All tables and types dropped. Run drizzle-kit push to recreate.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
