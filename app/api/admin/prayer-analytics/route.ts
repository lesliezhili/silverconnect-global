import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/prayer-analytics
 * Aggregated prayer report analytics for the admin dashboard.
 */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS faith_prayer_reports (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL UNIQUE, volunteer_id UUID NOT NULL, customer_id UUID NOT NULL,
      summary TEXT NOT NULL, prayer_topics TEXT[], scripture_shared TEXT,
      attendees INT DEFAULT 1, mood TEXT, follow_up_needed BOOLEAN DEFAULT false,
      follow_up_notes TEXT, private_prayer_note TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;

    // Total reports
    const [totals] = await sql`SELECT
      COUNT(*) as total_reports,
      SUM(attendees) as total_attendees,
      COUNT(*) FILTER (WHERE follow_up_needed = true) as follow_ups_needed,
      COUNT(DISTINCT volunteer_id) as active_volunteers,
      COUNT(DISTINCT customer_id) as seniors_served
      FROM faith_prayer_reports`;

    // Mood distribution
    const moods = await sql`SELECT mood, COUNT(*) as count
      FROM faith_prayer_reports WHERE mood IS NOT NULL
      GROUP BY mood ORDER BY count DESC`;

    // Top prayer topics (unnest the array)
    let topTopics: Record<string, unknown>[] = [];
    try {
      topTopics = await sql`SELECT topic, COUNT(*) as count
        FROM faith_prayer_reports, UNNEST(prayer_topics) as topic
        WHERE prayer_topics IS NOT NULL
        GROUP BY topic ORDER BY count DESC LIMIT 10`;
    } catch {}

    // Most shared scriptures
    const topScriptures = await sql`SELECT scripture_shared, COUNT(*) as count
      FROM faith_prayer_reports WHERE scripture_shared IS NOT NULL AND scripture_shared != ''
      GROUP BY scripture_shared ORDER BY count DESC LIMIT 10`;

    // Monthly trend
    const monthlyTrend = await sql`SELECT
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*) as reports,
      SUM(attendees) as attendees,
      COUNT(*) FILTER (WHERE follow_up_needed = true) as follow_ups
      FROM faith_prayer_reports
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC`;

    // Top volunteers (most reports)
    const topVolunteers = await sql`SELECT
      fpr.volunteer_id, u.name, u.email, COUNT(*) as report_count,
      SUM(fpr.attendees) as total_attendees
      FROM faith_prayer_reports fpr
      JOIN users u ON u.id = fpr.volunteer_id
      GROUP BY fpr.volunteer_id, u.name, u.email
      ORDER BY report_count DESC LIMIT 10`;

    // Pending follow-ups
    const pendingFollowUps = await sql`SELECT
      fpr.id, fpr.booking_id, fpr.follow_up_notes, fpr.created_at, fpr.mood,
      u_vol.name as volunteer_name, u_cust.name as customer_name
      FROM faith_prayer_reports fpr
      JOIN users u_vol ON u_vol.id = fpr.volunteer_id
      JOIN users u_cust ON u_cust.id = fpr.customer_id
      WHERE fpr.follow_up_needed = true
      ORDER BY fpr.created_at DESC LIMIT 20`;

    await sql.end();
    return NextResponse.json({
      success: true,
      overview: {
        totalReports: Number(totals.total_reports || 0),
        totalAttendees: Number(totals.total_attendees || 0),
        followUpsNeeded: Number(totals.follow_ups_needed || 0),
        activeVolunteers: Number(totals.active_volunteers || 0),
        seniorsServed: Number(totals.seniors_served || 0),
      },
      moodDistribution: moods.map((m: Record<string, unknown>) => ({ mood: m.mood, count: Number(m.count) })),
      topPrayerTopics: topTopics.map((t: Record<string, unknown>) => ({ topic: t.topic, count: Number(t.count) })),
      topScriptures: topScriptures.map((s: Record<string, unknown>) => ({ scripture: s.scripture_shared, count: Number(s.count) })),
      monthlyTrend: monthlyTrend.map((m: Record<string, unknown>) => ({ month: m.month, reports: Number(m.reports), attendees: Number(m.attendees), followUps: Number(m.follow_ups) })),
      topVolunteers: topVolunteers.map((v: Record<string, unknown>) => ({ name: v.name, email: v.email, reports: Number(v.report_count), attendees: Number(v.total_attendees) })),
      pendingFollowUps: pendingFollowUps,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
