import { NextRequest, NextResponse } from "next/server";
/**
 * GET /api/provider/tools?providerId= — List provider's tools/equipment
 * POST /api/provider/tools — Add tool/equipment
 * Body: { providerId, name, category, condition, available }
 */
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS provider_tools (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider_id UUID NOT NULL, name TEXT NOT NULL, category TEXT, condition TEXT DEFAULT 'good', available BOOLEAN DEFAULT true, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;
    const tools = await sql`SELECT * FROM provider_tools WHERE provider_id = ${providerId} ORDER BY category, name`;
    await sql.end();
    return NextResponse.json({ success: true, tools, count: tools.length });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  const { providerId, name, category, condition = "good", available = true, notes } = await req.json();
  if (!providerId || !name) return NextResponse.json({ error: "providerId, name required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS provider_tools (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider_id UUID NOT NULL, name TEXT NOT NULL, category TEXT, condition TEXT DEFAULT 'good', available BOOLEAN DEFAULT true, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;
    const [tool] = await sql`INSERT INTO provider_tools (provider_id, name, category, condition, available, notes) VALUES (${providerId}, ${name}, ${category || null}, ${condition}, ${available}, ${notes || null}) RETURNING id, name, category`;
    await sql.end();
    return NextResponse.json({ success: true, tool });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
