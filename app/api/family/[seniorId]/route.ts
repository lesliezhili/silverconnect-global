import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/family/[seniorId] — Detailed visit history for family members
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ seniorId: string }> }) {
  const { seniorId } = await params;
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    // Verify family link exists
    await sql`CREATE TABLE IF NOT EXISTS family_links (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, family_member_id UUID NOT NULL,
      senior_id UUID NOT NULL, relationship TEXT DEFAULT 'family',
      approved BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(family_member_id, senior_id))`;

    const [link] = await sql`SELECT * FROM family_links WHERE family_member_id = ${session.userId} AND senior_id = ${seniorId}`;
    if (!link) { await sql.end(); return NextResponse.json({ error: "Not linked to this senior" }, { status: 403 }); }

    // Senior info
    const [senior] = await sql`SELECT name, phone, created_at FROM users WHERE id = ${seniorId}`;

    // Visit history (recent 20)
    const visits = await sql`
      SELECT b.id, b.status, b.scheduled_at, b.completed_at, b.duration_min,
        s.code as service_code, u.name as volunteer_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN provider_profiles pp ON pp.id = b.provider_id
      LEFT JOIN users u ON u.id = pp.user_id
      WHERE b.customer_id = ${seniorId}
      ORDER BY COALESCE(b.completed_at, b.scheduled_at) DESC LIMIT 20`;

    // Upcoming
    const upcoming = await sql`
      SELECT b.id, b.scheduled_at, s.code as service_code, u.name as volunteer_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN provider_profiles pp ON pp.id = b.provider_id
      LEFT JOIN users u ON u.id = pp.user_id
      WHERE b.customer_id = ${seniorId} AND b.status = 'confirmed' AND b.scheduled_at >= NOW()
      ORDER BY b.scheduled_at ASC`;

    // Satisfaction surveys (family can see emotional state, not private notes)
    let surveys: Record<string, unknown>[] = [];
    try {
      surveys = await sql`SELECT overall_rating, emotional_state, would_recommend, felt_safe, visit_length, created_at
        FROM faith_satisfaction_surveys WHERE customer_id = ${seniorId}
        ORDER BY created_at DESC LIMIT 10`;
    } catch {}

    // Prayer report summaries (no private notes — privacy!)
    let prayerSummaries: Record<string, unknown>[] = [];
    try {
      prayerSummaries = await sql`SELECT mood, attendees, follow_up_needed, created_at
        FROM faith_prayer_reports WHERE customer_id = ${seniorId}
        ORDER BY created_at DESC LIMIT 10`;
    } catch {}

    await sql.end();
    return NextResponse.json({
      success: true,
      senior: { name: senior?.name, phone: senior?.phone, memberSince: senior?.created_at },
      approved: link.approved,
      visits: visits.map((v: Record<string, unknown>) => ({
        id: v.id, status: v.status, scheduledAt: v.scheduled_at, completedAt: v.completed_at,
        duration: v.duration_min, service: v.service_code, volunteer: v.volunteer_name,
      })),
      upcoming: upcoming.map((u: Record<string, unknown>) => ({
        id: u.id, scheduledAt: u.scheduled_at, service: u.service_code, volunteer: u.volunteer_name,
      })),
      surveys: surveys.map((s: Record<string, unknown>) => ({
        rating: s.overall_rating, emotional: s.emotional_state, safe: s.felt_safe,
        recommend: s.would_recommend, length: s.visit_length, date: s.created_at,
      })),
      wellbeing: prayerSummaries.map((p: Record<string, unknown>) => ({
        mood: p.mood, attendees: p.attendees, followUp: p.follow_up_needed, date: p.created_at,
      })),
    });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
