import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

const TUTORIAL_STEPS = [
  { id: "welcome", required: false },
  { id: "profile_setup", required: true },
  { id: "schedule_intro", required: true },
  { id: "first_booking", required: false },
  { id: "prayer_report_intro", required: true },
  { id: "team_chat_intro", required: false },
  { id: "goals_intro", required: false },
  { id: "complete", required: false },
];

/**
 * GET /api/provider/tutorial — Get tutorial progress
 * POST /api/provider/tutorial — Mark step complete
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

    await sql`CREATE TABLE IF NOT EXISTS volunteer_tutorial_progress (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      step_id TEXT NOT NULL,
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, step_id)
    )`;

    const completed = await sql`SELECT step_id, completed_at FROM volunteer_tutorial_progress WHERE user_id = ${session.userId}`;
    const completedSet = new Set(completed.map((c: Record<string, unknown>) => c.step_id));

    await sql.end();
    return NextResponse.json({
      success: true,
      totalSteps: TUTORIAL_STEPS.length,
      completedSteps: completedSet.size,
      isComplete: completedSet.size >= TUTORIAL_STEPS.length - 1,
      steps: TUTORIAL_STEPS.map(s => ({ ...s, completed: completedSet.has(s.id) })),
    });
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

    await sql`CREATE TABLE IF NOT EXISTS volunteer_tutorial_progress (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL,
      step_id TEXT NOT NULL, completed_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, step_id))`;

    const body = await req.json();
    const { stepId } = body;
    if (!stepId) { await sql.end(); return NextResponse.json({ error: "stepId required" }, { status: 400 }); }

    await sql`INSERT INTO volunteer_tutorial_progress (user_id, step_id) VALUES (${session.userId}, ${stepId}) ON CONFLICT DO NOTHING`;

    const [count] = await sql`SELECT COUNT(*) as cnt FROM volunteer_tutorial_progress WHERE user_id = ${session.userId}`;
    await sql.end();
    return NextResponse.json({ success: true, completedSteps: Number(count.cnt) });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
