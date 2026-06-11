import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/prayer-reports — Volunteer's prayer report history
 * Returns all prayer reports submitted by the logged-in volunteer.
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

    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS faith_prayer_reports (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, booking_id UUID NOT NULL UNIQUE,
      volunteer_id UUID NOT NULL, customer_id UUID NOT NULL, summary TEXT NOT NULL,
      prayer_topics TEXT[], scripture_shared TEXT, attendees INT DEFAULT 1,
      mood TEXT, follow_up_needed BOOLEAN DEFAULT false, follow_up_notes TEXT,
      private_prayer_note TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;

    // Get all reports by this volunteer
    const reports = await sql`
      SELECT fpr.id, fpr.booking_id, fpr.summary, fpr.prayer_topics, fpr.scripture_shared,
             fpr.attendees, fpr.mood, fpr.follow_up_needed, fpr.follow_up_notes,
             fpr.private_prayer_note, fpr.created_at,
             u.name as customer_name,
             b.scheduled_at, s.code as service_code
      FROM faith_prayer_reports fpr
      LEFT JOIN users u ON u.id = fpr.customer_id
      LEFT JOIN bookings b ON b.id = fpr.booking_id
      LEFT JOIN services s ON s.id = b.service_id
      WHERE fpr.volunteer_id = ${session.userId}
      ORDER BY fpr.created_at DESC
      LIMIT 100`;

    // Stats
    const [stats] = await sql`SELECT
      COUNT(*) as total_reports,
      SUM(attendees) as total_attendees,
      COUNT(*) FILTER (WHERE follow_up_needed = true) as follow_ups,
      COUNT(DISTINCT customer_id) as seniors_served
      FROM faith_prayer_reports
      WHERE volunteer_id = ${session.userId}`;

    await sql.end();
    return NextResponse.json({
      success: true,
      stats: {
        totalReports: Number(stats.total_reports || 0),
        totalAttendees: Number(stats.total_attendees || 0),
        followUps: Number(stats.follow_ups || 0),
        seniorsServed: Number(stats.seniors_served || 0),
      },
      reports: reports.map((r: Record<string, unknown>) => ({
        id: r.id,
        bookingId: r.booking_id,
        summary: r.summary,
        prayerTopics: r.prayer_topics,
        scriptureShared: r.scripture_shared,
        attendees: r.attendees,
        mood: r.mood,
        followUpNeeded: r.follow_up_needed,
        followUpNotes: r.follow_up_notes,
        privateNote: r.private_prayer_note,
        customerName: r.customer_name,
        serviceCode: r.service_code,
        scheduledAt: r.scheduled_at,
        createdAt: r.created_at,
      })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
