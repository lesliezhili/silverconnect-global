import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics-dashboard — Combined metrics overview
 * Unifies: bookings, volunteers, seniors, earnings, surveys, prayer reports, achievements
 */
export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    // Booking stats
    const [bookings] = await sql`SELECT
      COUNT(*) as total, COUNT(*) FILTER (WHERE status IN ('completed','released')) as completed,
      COUNT(*) FILTER (WHERE status = 'confirmed') as upcoming,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('week', NOW())) as this_week,
      COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('month', NOW())) as this_month
      FROM bookings`;

    // Volunteer stats
    const [vols] = await sql`SELECT
      COUNT(*) as total, COUNT(*) FILTER (WHERE onboarding_status = 'approved') as active,
      COUNT(*) FILTER (WHERE onboarding_status = 'pending') as pending,
      COUNT(*) FILTER (WHERE onboarding_status = 'suspended') as suspended
      FROM provider_profiles WHERE notes LIKE '%faith_volunteer%'`;

    // Senior stats
    const [seniors] = await sql`SELECT COUNT(DISTINCT customer_id) as total FROM bookings WHERE status IN ('completed','released')`;

    // Revenue/Donations
    let totalDonations = 0; let donationCount = 0;
    try {
      const [d] = await sql`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as cnt FROM faith_donations`;
      totalDonations = Number(d?.total || 0); donationCount = Number(d?.cnt || 0);
    } catch {}

    // Surveys
    let avgRating = 0; let surveyCount = 0; let wouldRecommend = 0;
    try {
      const [s] = await sql`SELECT AVG(overall_rating) as avg, COUNT(*) as cnt,
        COUNT(*) FILTER (WHERE would_recommend = true) as recommend
        FROM faith_satisfaction_surveys`;
      avgRating = Math.round(Number(s?.avg || 0) * 10) / 10;
      surveyCount = Number(s?.cnt || 0);
      wouldRecommend = Number(s?.recommend || 0);
    } catch {}

    // Prayer reports
    const reportStats = { total: 0, followUps: 0, moods: {} as Record<string, number> };
    try {
      const [rs] = await sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE follow_up_needed) as followups FROM faith_prayer_reports`;
      reportStats.total = Number(rs?.total || 0);
      reportStats.followUps = Number(rs?.followups || 0);
      const moods = await sql`SELECT mood, COUNT(*) as cnt FROM faith_prayer_reports WHERE mood IS NOT NULL GROUP BY mood`;
      for (const m of moods) reportStats.moods[m.mood as string] = Number(m.cnt);
    } catch {}

    // Achievements unlocked across all volunteers
    const achievementStats = { totalUnlocked: 0, topAchievements: [] as { id: string; count: number }[] };
    try {
      const [ac] = await sql`SELECT COUNT(*) as cnt FROM volunteer_achievements`;
      achievementStats.totalUnlocked = Number(ac?.cnt || 0);
      const top = await sql`SELECT achievement_id, COUNT(*) as cnt FROM volunteer_achievements GROUP BY achievement_id ORDER BY cnt DESC LIMIT 5`;
      achievementStats.topAchievements = top.map((t: Record<string, unknown>) => ({ id: t.achievement_id as string, count: Number(t.cnt) }));
    } catch {}

    // Team messages
    let msgStats = { total: 0, thisWeek: 0 };
    try {
      const [ms] = await sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW())) as week FROM volunteer_team_messages`;
      msgStats = { total: Number(ms?.total || 0), thisWeek: Number(ms?.week || 0) };
    } catch {}

    // Monthly trend (last 6 months)
    let monthlyTrend: { month: string; bookings: number; reports: number }[] = [];
    try {
      const trend = await sql`SELECT TO_CHAR(DATE_TRUNC('month', completed_at), 'YYYY-MM') as month, COUNT(*) as cnt
        FROM bookings WHERE status IN ('completed','released') AND completed_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1 ORDER BY 1`;
      monthlyTrend = trend.map((t: Record<string, unknown>) => ({ month: t.month as string, bookings: Number(t.cnt), reports: 0 }));
    } catch {}

    await sql.end();
    return NextResponse.json({
      success: true,
      bookings: { total: Number(bookings.total||0), completed: Number(bookings.completed||0), upcoming: Number(bookings.upcoming||0), cancelled: Number(bookings.cancelled||0), thisWeek: Number(bookings.this_week||0), thisMonth: Number(bookings.this_month||0) },
      volunteers: { total: Number(vols.total||0), active: Number(vols.active||0), pending: Number(vols.pending||0), suspended: Number(vols.suspended||0) },
      seniors: { total: Number(seniors.total||0) },
      financial: { totalDonations, donationCount },
      satisfaction: { avgRating, surveyCount, wouldRecommendPct: surveyCount > 0 ? Math.round((wouldRecommend/surveyCount)*100) : 0 },
      prayerReports: reportStats,
      achievements: achievementStats,
      teamMessages: msgStats,
      monthlyTrend,
    });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
