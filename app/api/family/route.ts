import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/family — Get linked seniors and their status
 * POST /api/family — Link a family member to a senior (by email/phone)
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    await sql`CREATE TABLE IF NOT EXISTS family_links (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      family_member_id UUID NOT NULL,
      senior_id UUID NOT NULL,
      relationship TEXT DEFAULT 'family',
      approved BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(family_member_id, senior_id)
    )`;

    // Get all linked seniors
    const links = await sql`
      SELECT fl.senior_id, fl.relationship, fl.approved, fl.created_at,
        u.name as senior_name, u.email as senior_email, u.phone as senior_phone
      FROM family_links fl
      JOIN users u ON u.id = fl.senior_id
      WHERE fl.family_member_id = ${session.userId}`;

    // For each linked senior, get summary
    const seniors = [];
    for (const link of links) {
      const [stats] = await sql`SELECT
        COUNT(*) as total_visits,
        COUNT(*) FILTER (WHERE status IN ('completed','released')) as completed,
        COUNT(*) FILTER (WHERE status = 'confirmed') as upcoming,
        MAX(completed_at) as last_visit
        FROM bookings WHERE customer_id = ${link.senior_id}`;

      let lastMood = null;
      try {
        const [lm] = await sql`SELECT mood FROM faith_prayer_reports WHERE customer_id = ${link.senior_id} ORDER BY created_at DESC LIMIT 1`;
        lastMood = lm?.mood || null;
      } catch {}

      let lastSurvey = null;
      try {
        const [ls] = await sql`SELECT overall_rating, emotional_state, created_at FROM faith_satisfaction_surveys WHERE customer_id = ${link.senior_id} ORDER BY created_at DESC LIMIT 1`;
        lastSurvey = ls ? { rating: ls.overall_rating, emotional: ls.emotional_state, date: ls.created_at } : null;
      } catch {}

      seniors.push({
        seniorId: link.senior_id,
        name: link.senior_name || "Senior",
        phone: link.senior_phone,
        relationship: link.relationship,
        approved: link.approved,
        linkedAt: link.created_at,
        stats: { totalVisits: Number(stats.total_visits||0), completed: Number(stats.completed||0), upcoming: Number(stats.upcoming||0), lastVisit: stats.last_visit },
        lastMood, lastSurvey,
      });
    }

    await sql.end();
    return NextResponse.json({ success: true, linkedSeniors: seniors });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    await sql`CREATE TABLE IF NOT EXISTS family_links (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, family_member_id UUID NOT NULL,
      senior_id UUID NOT NULL, relationship TEXT DEFAULT 'family',
      approved BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(family_member_id, senior_id))`;

    const body = await req.json();
    const { seniorEmail, seniorPhone, relationship } = body;

    // Find senior by email or phone
    let senior;
    if (seniorEmail) {
      [senior] = await sql`SELECT id, name FROM users WHERE email = ${seniorEmail}`;
    } else if (seniorPhone) {
      [senior] = await sql`SELECT id, name FROM users WHERE phone = ${seniorPhone}`;
    }

    if (!senior) { await sql.end(); return NextResponse.json({ error: "Senior not found. Please check their email or phone number." }, { status: 404 }); }

    // Create link (pending approval)
    await sql`INSERT INTO family_links (family_member_id, senior_id, relationship, approved)
      VALUES (${session.userId}, ${senior.id}, ${relationship || 'family'}, false)
      ON CONFLICT (family_member_id, senior_id) DO NOTHING`;

    // Notify senior
    try {
      const [user] = await sql`SELECT name FROM users WHERE id = ${session.userId}`;
      await sql`INSERT INTO notifications (user_id, kind, title, body)
        VALUES (${senior.id}, 'system', 'Family Link Request', ${(user?.name || 'Someone') + ' wants to connect as family'})`;
    } catch {}

    await sql.end();
    return NextResponse.json({ success: true, seniorName: senior.name, message: "Link request sent. Senior must approve." });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
