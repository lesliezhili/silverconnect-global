import { NextResponse } from "next/server";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const SECRET = process.env.SESSION_SECRET;

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const sql = postgres(url, { prepare: false, connect_timeout: 30 });

  try {
    const schemaPath = join(process.cwd(), "drizzle", "combined-schema.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    // Split by semicolons followed by newline (standard SQL statement delimiter)
    const statements = schemaSql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    let executed = 0;
    const errors: string[] = [];

    for (const stmt of statements) {
      if (!stmt || stmt.startsWith("--")) continue;
      try {
        await sql.unsafe(stmt);
        executed++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        // Skip "already exists" errors
        if (msg.includes("already exists") || msg.includes("duplicate key")) {
          executed++;
          continue;
        }
        errors.push(`${msg.slice(0, 120)} | SQL: ${stmt.slice(0, 80)}...`);
        if (errors.length > 20) break;
      }
    }

    await sql.end();
    return NextResponse.json({
      success: errors.length === 0,
      executed,
      totalStatements: statements.length,
      errors: errors.slice(0, 20),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
