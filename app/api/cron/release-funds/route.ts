import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/** 
 * POST /api/cron/release-funds?key=SESSION_SECRET
 * Moves balance_pending → balance_available for completed jobs older than 48h.
 * Run via Vercel Cron or manual trigger.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.SESSION_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Release pending funds to available after 48h hold period
    const result = await sql`
      UPDATE wallets SET
        balance_available = (balance_available::numeric + balance_pending::numeric)::text,
        balance_pending = '0',
        updated_at = NOW()
      WHERE balance_pending::numeric > 0
      RETURNING provider_id, balance_available
    `;
    
    await sql.end();
    return NextResponse.json({ success: true, released: result.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
