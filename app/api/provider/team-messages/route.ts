import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/provider/team-messages — Get team chat messages
 * POST /api/provider/team-messages — Send a team message
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

    await sql`CREATE TABLE IF NOT EXISTS volunteer_team_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sender_id UUID NOT NULL,
      channel TEXT DEFAULT 'general',
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      reply_to UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "general";
    const before = searchParams.get("before");

    let messages;
    if (before) {
      messages = await sql`SELECT m.*, u.name as sender_name, u.email as sender_email
        FROM volunteer_team_messages m JOIN users u ON u.id = m.sender_id
        WHERE m.channel = ${channel} AND m.created_at < ${before}
        ORDER BY m.created_at DESC LIMIT 30`;
    } else {
      messages = await sql`SELECT m.*, u.name as sender_name, u.email as sender_email
        FROM volunteer_team_messages m JOIN users u ON u.id = m.sender_id
        WHERE m.channel = ${channel}
        ORDER BY m.created_at DESC LIMIT 30`;
    }

    // Count online volunteers (active in last 5 min — approximation)
    const [online] = await sql`SELECT COUNT(DISTINCT sender_id) as cnt FROM volunteer_team_messages WHERE created_at > NOW() - INTERVAL '5 minutes'`;

    await sql.end();
    return NextResponse.json({
      success: true,
      channel,
      onlineCount: Number(online?.cnt || 0),
      messages: messages.reverse().map((m: Record<string, unknown>) => ({
        id: m.id, senderId: m.sender_id, senderName: m.sender_name || (m.sender_email as string)?.split("@")[0],
        content: m.content, type: m.message_type, replyTo: m.reply_to,
        createdAt: m.created_at, isMe: m.sender_id === session.userId,
      })),
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
    const session = await getIronSession<{ userId?: string; name?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    await sql`CREATE TABLE IF NOT EXISTS volunteer_team_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, sender_id UUID NOT NULL,
      channel TEXT DEFAULT 'general', content TEXT NOT NULL, message_type TEXT DEFAULT 'text',
      reply_to UUID, created_at TIMESTAMPTZ DEFAULT NOW())`;

    const body = await req.json();
    const { content, channel, type, replyTo } = body;
    if (!content || content.trim().length === 0) { await sql.end(); return NextResponse.json({ error: "Empty message" }, { status: 400 }); }

    const [msg] = await sql`INSERT INTO volunteer_team_messages (sender_id, channel, content, message_type, reply_to)
      VALUES (${session.userId}, ${channel || "general"}, ${content.trim()}, ${type || "text"}, ${replyTo || null})
      RETURNING id, created_at`;

    await sql.end();
    return NextResponse.json({ success: true, messageId: msg.id, createdAt: msg.created_at });
  } catch (e: unknown) { await sql.end(); return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
