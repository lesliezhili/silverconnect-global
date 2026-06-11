import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/bookings/[id]/complete-faith
 * Faith-specific completion: volunteer submits a prayer report after the visit.
 * Body: {
 *   prayerTopics?: string[] (what was prayed about),
 *   scriptureShared?: string (Bible passage used),
 *   attendees?: number,
 *   mood?: "joyful" | "peaceful" | "struggling" | "grieving",
 *   followUpNeeded?: boolean,
 *   followUpNotes?: string,
 *   privatePrayerNote?: string (volunteer-only, not shared with customer),
 *   summary: string (visible to customer)
 * }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
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
    const { prayerTopics, scriptureShared, attendees, mood, followUpNeeded, followUpNotes, privatePrayerNote, summary } = body;

    if (!summary) { await sql.end(); return NextResponse.json({ error: "Summary required" }, { status: 400 }); }

    // Verify booking
    const [booking] = await sql`SELECT id, status, provider_id, customer_id FROM bookings WHERE id = ${bookingId}`;
    if (!booking) { await sql.end(); return NextResponse.json({ error: "Booking not found" }, { status: 404 }); }
    if (!["confirmed", "in_progress"].includes(booking.status)) {
      await sql.end(); return NextResponse.json({ error: "Booking not in progress" }, { status: 400 });
    }

    // Ensure prayer_reports table
    await sql`CREATE TABLE IF NOT EXISTS faith_prayer_reports (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL UNIQUE,
      volunteer_id UUID NOT NULL,
      customer_id UUID NOT NULL,
      summary TEXT NOT NULL,
      prayer_topics TEXT[],
      scripture_shared TEXT,
      attendees INT DEFAULT 1,
      mood TEXT,
      follow_up_needed BOOLEAN DEFAULT false,
      follow_up_notes TEXT,
      private_prayer_note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Insert prayer report
    const topics = prayerTopics?.length ? prayerTopics : null;
    const [report] = await sql`INSERT INTO faith_prayer_reports
      (booking_id, volunteer_id, customer_id, summary, prayer_topics, scripture_shared, attendees, mood, follow_up_needed, follow_up_notes, private_prayer_note)
      VALUES (${bookingId}, ${session.userId}, ${booking.customer_id}, ${summary}, ${topics}, ${scriptureShared || null}, ${attendees || 1}, ${mood || null}, ${followUpNeeded || false}, ${followUpNotes || null}, ${privatePrayerNote || null})
      ON CONFLICT (booking_id) DO UPDATE SET summary = EXCLUDED.summary, prayer_topics = EXCLUDED.prayer_topics,
        scripture_shared = EXCLUDED.scripture_shared, mood = EXCLUDED.mood, follow_up_needed = EXCLUDED.follow_up_needed
      RETURNING id`;

    // Update booking status
    await sql`UPDATE bookings SET status = 'completed', completed_at = NOW() WHERE id = ${bookingId}`;

    // Notify customer
    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${booking.customer_id}, 'booking_update', 'Visit Completed \u2764\ufe0f', ${summary.substring(0, 100)}, ${'/bookings/' + bookingId})`;

    // Auto-insert a system message in the chat
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY, booking_id UUID NOT NULL,
      sender_id UUID NOT NULL, content TEXT NOT NULL, message_type TEXT DEFAULT 'text',
      is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`INSERT INTO messages (booking_id, sender_id, content, message_type)
      VALUES (${bookingId}, ${session.userId}, ${'\u2705 Visit completed. ' + summary}, 'system')`;

    // Notify volunteer: prayer report submitted successfully, link to history
    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${session.userId}, 'booking_update', 'Prayer Report Saved \u2705', ${'Your prayer report for this visit has been saved. View all your reports.'}, ${'/provider/prayer-reports'})`;

    // If follow-up needed, create a system alert
    if (followUpNeeded) {
      await sql`INSERT INTO notifications (user_id, kind, title, body, link)
        VALUES (${session.userId}, 'system', 'Follow-up Reminder', ${'Senior may need another visit: ' + (followUpNotes || 'Check in next week')}, ${'/provider/prayer-reports'})`;
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      reportId: report.id,
      bookingStatus: "completed",
      message: "Prayer report submitted. Thank you for serving! God bless your ministry.",
      followUpScheduled: followUpNeeded || false,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
