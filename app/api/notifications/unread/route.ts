import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/notifications/unread — Returns unread counts for badge display
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

    // Unread messages (across all bookings where user is customer or provider)
    let unreadMessages = 0;
    try {
      await sql`CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY, booking_id UUID NOT NULL,
        sender_id UUID NOT NULL, content TEXT NOT NULL, message_type TEXT DEFAULT 'text',
        is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())`;

      const [msgCount] = await sql`
        SELECT COUNT(*) as cnt FROM messages m
        JOIN bookings b ON b.id = m.booking_id
        WHERE m.is_read = false AND m.sender_id != ${session.userId}
          AND (b.customer_id = ${session.userId} OR b.provider_id = (
            SELECT id FROM provider_profiles WHERE user_id = ${session.userId} LIMIT 1
          ))`;
      unreadMessages = Number(msgCount?.cnt || 0);
    } catch {}

    // Unread notifications
    let unreadNotifs = 0;
    try {
      const [nCount] = await sql`SELECT COUNT(*) as cnt FROM notifications
        WHERE user_id = ${session.userId} AND read_at IS NULL`;
      unreadNotifs = Number(nCount?.cnt || 0);
    } catch {
      // notifications table might not have read_at column
      try {
        const [nCount] = await sql`SELECT COUNT(*) as cnt FROM notifications
          WHERE user_id = ${session.userId} AND created_at > NOW() - INTERVAL '7 days'`;
        unreadNotifs = Number(nCount?.cnt || 0);
      } catch {}
    }

    // Pending follow-ups (provider only)
    let pendingFollowUps = 0;
    try {
      const [fuCount] = await sql`SELECT COUNT(*) as cnt FROM faith_prayer_reports
        WHERE volunteer_id = ${session.userId} AND follow_up_needed = true
        AND created_at > NOW() - INTERVAL '14 days'`;
      pendingFollowUps = Number(fuCount?.cnt || 0);
    } catch {}

    await sql.end();
    return NextResponse.json({
      success: true,
      unreadMessages,
      unreadNotifications: unreadNotifs,
      pendingFollowUps,
      totalBadge: unreadMessages + unreadNotifs,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
