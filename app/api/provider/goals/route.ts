import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/goals — Current week's progress vs goals
 * POST /api/provider/goals — Set weekly goals
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

    // Ensure goals table
    await sql`CREATE TABLE IF NOT EXISTS volunteer_weekly_goals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      week_start DATE NOT NULL,
      visits_goal INT DEFAULT 3,
      prayer_reports_goal INT DEFAULT 3,
      seniors_goal INT DEFAULT 2,
      personal_goal TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, week_start)
    )`;

    // Current week start (Monday)
    const [weekRow] = await sql`SELECT DATE_TRUNC('week', NOW())::date as week_start`;
    const weekStart = weekRow.week_start;

    // Get or create goals for this week
    let [goals] = await sql`SELECT * FROM volunteer_weekly_goals WHERE user_id = ${session.userId} AND week_start = ${weekStart}`;
    if (!goals) {
      // Copy from previous week or use defaults
      const [prev] = await sql`SELECT visits_goal, prayer_reports_goal, seniors_goal, personal_goal
        FROM volunteer_weekly_goals WHERE user_id = ${session.userId} ORDER BY week_start DESC LIMIT 1`;
      const vg = prev?.visits_goal || 3;
      const prg = prev?.prayer_reports_goal || 3;
      const sg = prev?.seniors_goal || 2;
      const pg = prev?.personal_goal || null;
      [goals] = await sql`INSERT INTO volunteer_weekly_goals (user_id, week_start, visits_goal, prayer_reports_goal, seniors_goal, personal_goal)
        VALUES (${session.userId}, ${weekStart}, ${vg}, ${prg}, ${sg}, ${pg})
        RETURNING *`;
    }

    // Get provider profile for booking queries
    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;

    // Calculate actual progress this week
    let visitsActual = 0;
    let reportsActual = 0;
    let seniorsActual = 0;
    if (profile) {
      const [va] = await sql`SELECT COUNT(*) as cnt FROM bookings
        WHERE provider_id = ${profile.id} AND status IN ('completed','released')
        AND completed_at >= ${weekStart}`;
      visitsActual = Number(va?.cnt || 0);
    }

    const [ra] = await sql`SELECT COUNT(*) as cnt, COUNT(DISTINCT customer_id) as seniors
      FROM faith_prayer_reports WHERE volunteer_id = ${session.userId} AND created_at >= ${weekStart}`;
    reportsActual = Number(ra?.cnt || 0);
    seniorsActual = Number(ra?.seniors || 0);

    // Streak (consecutive weeks with goals met)
    let streak = 0;
    try {
      const weeks = await sql`SELECT week_start FROM volunteer_weekly_goals
        WHERE user_id = ${session.userId} ORDER BY week_start DESC LIMIT 12`;
      for (const w of weeks) {
        const [wk] = await sql`SELECT COUNT(*) as cnt FROM bookings b
          JOIN provider_profiles pp ON pp.id = b.provider_id
          WHERE pp.user_id = ${session.userId} AND b.status IN ('completed','released')
          AND b.completed_at >= ${w.week_start}::date AND b.completed_at < ${w.week_start}::date + INTERVAL '7 days'`;
        if (Number(wk?.cnt || 0) >= Number(goals.visits_goal || 3)) streak++;
        else break;
      }
    } catch {}

    await sql.end();
    return NextResponse.json({
      success: true,
      weekStart,
      goals: {
        visits: Number(goals.visits_goal),
        prayerReports: Number(goals.prayer_reports_goal),
        seniors: Number(goals.seniors_goal),
        personalGoal: goals.personal_goal,
      },
      progress: { visits: visitsActual, prayerReports: reportsActual, seniors: seniorsActual },
      streak,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
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

    const body = await req.json();
    const { visits, prayerReports, seniors, personalGoal } = body;

    await sql`CREATE TABLE IF NOT EXISTS volunteer_weekly_goals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL,
      week_start DATE NOT NULL, visits_goal INT DEFAULT 3, prayer_reports_goal INT DEFAULT 3,
      seniors_goal INT DEFAULT 2, personal_goal TEXT, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, week_start))`;

    const [weekRow] = await sql`SELECT DATE_TRUNC('week', NOW())::date as week_start`;

    await sql`INSERT INTO volunteer_weekly_goals (user_id, week_start, visits_goal, prayer_reports_goal, seniors_goal, personal_goal)
      VALUES (${session.userId}, ${weekRow.week_start}, ${visits || 3}, ${prayerReports || 3}, ${seniors || 2}, ${personalGoal || null})
      ON CONFLICT (user_id, week_start) DO UPDATE SET
        visits_goal = EXCLUDED.visits_goal, prayer_reports_goal = EXCLUDED.prayer_reports_goal,
        seniors_goal = EXCLUDED.seniors_goal, personal_goal = EXCLUDED.personal_goal`;

    await sql.end();
    return NextResponse.json({ success: true, message: "Goals updated" });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
