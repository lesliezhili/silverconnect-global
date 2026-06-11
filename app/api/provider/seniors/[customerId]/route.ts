import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/seniors/[customerId] — Senior profile + visit history
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    // Get senior info
    const [senior] = await sql`SELECT id, name, email, phone, created_at FROM users WHERE id = ${customerId}`;
    if (!senior) { await sql.end(); return NextResponse.json({ error: "Senior not found" }, { status: 404 }); }

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not a provider" }, { status: 404 }); }

    // Visit history (bookings between this provider and this senior)
    const visits = await sql`SELECT b.id, b.status, b.scheduled_at, b.completed_at, b.duration_min, b.notes,
        s.code as service_code
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.provider_id = ${profile.id} AND b.customer_id = ${customerId}
      ORDER BY COALESCE(b.completed_at, b.scheduled_at) DESC LIMIT 20`;

    // Prayer reports for this senior
    const reports = await sql`SELECT id, summary, prayer_topics, scripture_shared, mood, follow_up_needed, created_at
      FROM faith_prayer_reports
      WHERE volunteer_id = ${session.userId} AND customer_id = ${customerId}
      ORDER BY created_at DESC LIMIT 10`;

    // Stats
    const [stats] = await sql`SELECT
      COUNT(*) as total_visits,
      COUNT(*) FILTER (WHERE status IN ('completed','released')) as completed,
      MIN(scheduled_at) as first_visit,
      MAX(completed_at) as last_visit
      FROM bookings WHERE provider_id = ${profile.id} AND customer_id = ${customerId}`;

    // Survey feedback from this senior
    let feedback: Record<string, unknown>[] = [];
    try {
      feedback = await sql`SELECT overall_rating, emotional_state, what_helped, created_at
        FROM faith_satisfaction_surveys WHERE customer_id = ${customerId} AND provider_id = ${profile.id}
        ORDER BY created_at DESC LIMIT 5`;
    } catch {}

    // Donations from this senior
    let donations: Record<string, unknown>[] = [];
    try {
      donations = await sql`SELECT amount, message, created_at FROM faith_donations
        WHERE donor_id = ${customerId} AND recipient_provider_id = ${profile.id}
        ORDER BY created_at DESC LIMIT 5`;
    } catch {}

    await sql.end();
    return NextResponse.json({
      success: true,
      senior: { id: senior.id, name: senior.name, phone: senior.phone, memberSince: senior.created_at },
      stats: {
        totalVisits: Number(stats.total_visits || 0),
        completed: Number(stats.completed || 0),
        firstVisit: stats.first_visit,
        lastVisit: stats.last_visit,
      },
      visits: visits.map((v: Record<string, unknown>) => ({
        id: v.id, status: v.status, scheduledAt: v.scheduled_at, completedAt: v.completed_at,
        duration: v.duration_min, service: v.service_code, notes: v.notes,
      })),
      prayerReports: reports.map((r: Record<string, unknown>) => ({
        id: r.id, summary: r.summary, topics: r.prayer_topics, scripture: r.scripture_shared,
        mood: r.mood, followUp: r.follow_up_needed, date: r.created_at,
      })),
      feedback: feedback.map((f: Record<string, unknown>) => ({
        rating: f.overall_rating, emotional: f.emotional_state, helped: f.what_helped, date: f.created_at,
      })),
      donations: donations.map((d: Record<string, unknown>) => ({
        amount: Number(d.amount), message: d.message, date: d.created_at,
      })),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
