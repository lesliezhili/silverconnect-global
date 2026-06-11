import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/dashboard — Unified provider stats
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

    const [profile] = await sql`SELECT id, notes, onboarding_status FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not a provider" }, { status: 404 }); }
    const [user] = await sql`SELECT name, email FROM users WHERE id = ${session.userId}`;

    const isFaith = profile.notes && (profile.notes as string).includes("faith_volunteer");

    // Booking stats
    const [bookingStats] = await sql`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed' OR status = 'released') as completed,
      COUNT(*) FILTER (WHERE status = 'confirmed') as upcoming,
      COUNT(*) FILTER (WHERE status = 'in_progress') as active
      FROM bookings WHERE provider_id = ${profile.id}`;

    // Earnings
    let totalEarnings = 0;
    try {
      const [wallet] = await sql`SELECT balance_available, balance_pending FROM wallets WHERE provider_id = ${profile.id}`;
      if (wallet) totalEarnings = Number(wallet.balance_available || 0) + Number(wallet.balance_pending || 0);
    } catch {}

    // Donations
    let donationTotal = 0;
    let donationCount = 0;
    try {
      const [d] = await sql`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as cnt FROM faith_donations WHERE recipient_provider_id = ${profile.id}`;
      donationTotal = Number(d?.total || 0);
      donationCount = Number(d?.cnt || 0);
    } catch {}

    // Prayer reports
    let prayerStats = { total: 0, attendees: 0, seniors: 0, followUps: 0 };
    try {
      const [ps] = await sql`SELECT COUNT(*) as total, COALESCE(SUM(attendees),0) as attended,
        COUNT(DISTINCT customer_id) as seniors, COUNT(*) FILTER (WHERE follow_up_needed) as followups
        FROM faith_prayer_reports WHERE volunteer_id = ${session.userId}`;
      prayerStats = { total: Number(ps.total||0), attendees: Number(ps.attended||0), seniors: Number(ps.seniors||0), followUps: Number(ps.followups||0) };
    } catch {}

    // Reviews/ratings
    let avgRating = 0;
    let reviewCount = 0;
    try {
      const [rv] = await sql`SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE provider_id = ${profile.id} AND status = 'published'`;
      avgRating = Number(rv?.avg_rating || 0);
      reviewCount = Number(rv?.cnt || 0);
    } catch {}

    // Recent activity (last 5 bookings)
    const recentBookings = await sql`SELECT b.id, b.status, b.scheduled_at, b.completed_at, s.code as service_code, u.name as customer_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = ${profile.id}
      ORDER BY COALESCE(b.completed_at, b.scheduled_at) DESC LIMIT 5`;

    // Upcoming bookings (next 7 days)
    const upcomingBookings = await sql`SELECT b.id, b.scheduled_at, s.code as service_code, u.name as customer_name
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = ${profile.id} AND b.status = 'confirmed'
        AND b.scheduled_at >= NOW() AND b.scheduled_at <= NOW() + INTERVAL '7 days'
      ORDER BY b.scheduled_at ASC LIMIT 5`;

    await sql.end();
    return NextResponse.json({
      success: true,
      volunteer: { name: user?.name || user?.email, isFaith, status: profile.onboarding_status },
      stats: {
        totalBookings: Number(bookingStats.total || 0),
        completed: Number(bookingStats.completed || 0),
        upcoming: Number(bookingStats.upcoming || 0),
        active: Number(bookingStats.active || 0),
        totalEarnings,
        donationTotal,
        donationCount,
        totalIncome: totalEarnings + donationTotal,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
        prayerReports: prayerStats.total,
        attendees: prayerStats.attendees,
        seniorsServed: prayerStats.seniors,
        followUps: prayerStats.followUps,
      },
      recentBookings: recentBookings.map((b: Record<string, unknown>) => ({
        id: b.id, status: b.status, scheduledAt: b.scheduled_at, completedAt: b.completed_at,
        service: b.service_code, customer: b.customer_name,
      })),
      upcomingBookings: upcomingBookings.map((b: Record<string, unknown>) => ({
        id: b.id, scheduledAt: b.scheduled_at, service: b.service_code, customer: b.customer_name,
      })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
