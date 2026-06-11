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

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const volunteers = await sql`SELECT pp.id as provider_id, pp.user_id, u.name, u.email
      FROM provider_profiles pp JOIN users u ON u.id = pp.user_id
      WHERE pp.onboarding_status = 'approved' AND pp.notes LIKE '%faith_volunteer%'`;

    if (volunteers.length === 0) { await sql.end(); return NextResponse.json({ success: true, leaderboard: [], myRank: 0 }); }

    const leaderboard: Array<{ userId: string; name: string; rank: number; score: number; level: string; badge: string; visits: number; reports: number; fiveStars: number; seniorsServed: number; isCurrentUser: boolean }> = [];

    for (const vol of volunteers) {
      const pid = vol.provider_id; const uid = vol.user_id as string;

      const [vc] = period === "week"
        ? await sql`SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = ${pid} AND status IN ('completed','released') AND completed_at >= DATE_TRUNC('week', NOW())`
        : period === "all"
        ? await sql`SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = ${pid} AND status IN ('completed','released')`
        : await sql`SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = ${pid} AND status IN ('completed','released') AND completed_at >= DATE_TRUNC('month', NOW())`;
      const visits = Number(vc?.cnt || 0);

      const [rc] = period === "week"
        ? await sql`SELECT COUNT(*) as cnt FROM faith_prayer_reports WHERE volunteer_id = ${uid} AND created_at >= DATE_TRUNC('week', NOW())`
        : period === "all"
        ? await sql`SELECT COUNT(*) as cnt FROM faith_prayer_reports WHERE volunteer_id = ${uid}`
        : await sql`SELECT COUNT(*) as cnt FROM faith_prayer_reports WHERE volunteer_id = ${uid} AND created_at >= DATE_TRUNC('month', NOW())`;
      const reports = Number(rc?.cnt || 0);

      let fiveStars = 0;
      try { const [fs] = await sql`SELECT COUNT(*) as cnt FROM reviews WHERE provider_id = ${pid} AND rating = 5`; fiveStars = Number(fs?.cnt || 0); } catch {}

      let seniorsServed = 0;
      try { const [ss] = await sql`SELECT COUNT(DISTINCT customer_id) as cnt FROM bookings WHERE provider_id = ${pid} AND status IN ('completed','released')`; seniorsServed = Number(ss?.cnt || 0); } catch {}

      const score = (visits * 10) + (reports * 15) + (fiveStars * 5) + (seniorsServed * 8);
      let level = "Beginner"; let badge = "\ud83c\udf31";
      if (score >= 500) { level = "Champion"; badge = "\ud83d\udc51"; }
      else if (score >= 300) { level = "Guardian"; badge = "\ud83d\udee1\ufe0f"; }
      else if (score >= 150) { level = "Shepherd"; badge = "\u2728"; }
      else if (score >= 50) { level = "Helper"; badge = "\ud83e\udd1d"; }

      leaderboard.push({ userId: uid, name: (vol.name as string) || (vol.email as string)?.split("@")[0] || "Volunteer", rank: 0, score, level, badge, visits, reports, fiveStars, seniorsServed, isCurrentUser: uid === session.userId });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((v, i) => { v.rank = i + 1; });

    await sql.end();
    return NextResponse.json({ success: true, period, totalVolunteers: leaderboard.length, myRank: leaderboard.find(v => v.isCurrentUser)?.rank || 0, myScore: leaderboard.find(v => v.isCurrentUser)?.score || 0, leaderboard: leaderboard.slice(0, 20) });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
