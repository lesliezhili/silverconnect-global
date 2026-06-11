import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

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

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not a provider" }, { status: 404 }); }

    const seniors = await sql`
      SELECT u.id, u.name, u.phone, COUNT(b.id) as total_visits,
        COUNT(b.id) FILTER (WHERE b.status IN ('completed','released')) as completed_visits,
        MAX(b.completed_at) as last_visit, MIN(b.scheduled_at) as first_visit
      FROM bookings b JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = ${profile.id}
      GROUP BY u.id, u.name, u.phone
      ORDER BY MAX(b.completed_at) DESC NULLS LAST`;

    const reportCounts = await sql`
      SELECT customer_id, COUNT(*) as report_count, MAX(mood) as last_mood
      FROM faith_prayer_reports WHERE volunteer_id = ${session.userId} GROUP BY customer_id`;
    const reportMap: Record<string, { count: number; mood: string }> = {};
    for (const rc of reportCounts) { reportMap[rc.customer_id as string] = { count: Number(rc.report_count), mood: rc.last_mood as string }; }

    const followUps = await sql`SELECT DISTINCT customer_id FROM faith_prayer_reports
      WHERE volunteer_id = ${session.userId} AND follow_up_needed = true AND created_at > NOW() - INTERVAL '14 days'`;
    const followUpSet = new Set(followUps.map((f: Record<string, unknown>) => f.customer_id));

    await sql.end();
    return NextResponse.json({
      success: true, totalSeniors: seniors.length,
      seniors: seniors.map((s: Record<string, unknown>) => ({
        id: s.id, name: s.name || "Senior", phone: s.phone,
        totalVisits: Number(s.total_visits || 0), completedVisits: Number(s.completed_visits || 0),
        lastVisit: s.last_visit, firstVisit: s.first_visit,
        reportCount: reportMap[s.id as string]?.count || 0,
        lastMood: reportMap[s.id as string]?.mood || null,
        needsFollowUp: followUpSet.has(s.id),
      })),
    });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
