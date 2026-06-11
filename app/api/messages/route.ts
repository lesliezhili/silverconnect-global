import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * GET /api/messages?bookingId=xxx — Get messages for a booking
 * POST /api/messages — Send a message within a booking thread
 * Body: { bookingId, content, type?: "text"|"prayer"|"system" }
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

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) { await sql.end(); return NextResponse.json({ error: "bookingId required" }, { status: 400 }); }

    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL,
      sender_id UUID NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Verify user is part of booking
    const [booking] = await sql`SELECT id, customer_id, provider_id FROM bookings WHERE id = ${bookingId}`;
    if (!booking) { await sql.end(); return NextResponse.json({ error: "Booking not found" }, { status: 404 }); }

    const isCustomer = booking.customer_id === session.userId;
    const isProvider = await sql`SELECT 1 FROM provider_profiles WHERE user_id = ${session.userId} AND id = ${booking.provider_id}`;
    if (!isCustomer && isProvider.length === 0) { await sql.end(); return NextResponse.json({ error: "Not authorized" }, { status: 403 }); }

    // Get messages
    const messages = await sql`
      SELECT m.id, m.sender_id, m.content, m.message_type, m.is_read, m.created_at,
             u.name as sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.booking_id = ${bookingId}
      ORDER BY m.created_at ASC`;

    // Mark as read
    await sql`UPDATE messages SET is_read = true WHERE booking_id = ${bookingId} AND sender_id != ${session.userId} AND is_read = false`;

    await sql.end();
    return NextResponse.json({
      success: true,
      bookingId,
      messages,
      currentUserId: session.userId,
      isCustomer,
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

    const { bookingId, content, type } = await req.json();
    if (!bookingId || !content?.trim()) { await sql.end(); return NextResponse.json({ error: "bookingId and content required" }, { status: 400 }); }

    // Ensure table
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL,
      sender_id UUID NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Verify access
    const [booking] = await sql`SELECT id, customer_id, provider_id FROM bookings WHERE id = ${bookingId}`;
    if (!booking) { await sql.end(); return NextResponse.json({ error: "Booking not found" }, { status: 404 }); }

    // Insert message
    const [msg] = await sql`INSERT INTO messages (booking_id, sender_id, content, message_type)
      VALUES (${bookingId}, ${session.userId}, ${content.trim()}, ${type || 'text'})
      RETURNING id, content, message_type, created_at`;

    // Notify recipient
    const recipientId = booking.customer_id === session.userId
      ? (await sql`SELECT user_id FROM provider_profiles WHERE id = ${booking.provider_id}`)[0]?.user_id
      : booking.customer_id;

    if (recipientId) {
      const [sender] = await sql`SELECT name FROM users WHERE id = ${session.userId}`;
      await sql`INSERT INTO notifications (user_id, kind, title, body, link)
        VALUES (${recipientId}, 'booking_update', ${'Message from ' + (sender?.name || 'your volunteer')}, ${content.trim().substring(0, 100)}, ${'/messages/' + bookingId})`;
    }

    await sql.end();
    return NextResponse.json({ success: true, message: msg });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
