import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

/**
 * POST /api/bookings/[id]/survey — Senior submits satisfaction survey
 * Body: {
 *   overallRating: 1-5,
 *   wouldRecommend: boolean,
 *   feltSafe: boolean,
 *   feltListenedTo: boolean,
 *   visitLength: "too_short" | "just_right" | "too_long",
 *   whatHelped?: string (free text),
 *   improvements?: string (free text),
 *   wouldBookAgain: boolean,
 *   emotionalState: "much_better" | "better" | "same" | "worse"
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
    const { overallRating, wouldRecommend, feltSafe, feltListenedTo, visitLength, whatHelped, improvements, wouldBookAgain, emotionalState } = body;

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      await sql.end(); return NextResponse.json({ error: "Rating 1-5 required" }, { status: 400 });
    }

    // Verify booking belongs to user
    const [booking] = await sql`SELECT id, customer_id, provider_id FROM bookings WHERE id = ${bookingId}`;
    if (!booking) { await sql.end(); return NextResponse.json({ error: "Booking not found" }, { status: 404 }); }
    if (booking.customer_id !== session.userId) { await sql.end(); return NextResponse.json({ error: "Not your booking" }, { status: 403 }); }

    // Ensure table
    await sql`CREATE TABLE IF NOT EXISTS faith_satisfaction_surveys (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL UNIQUE,
      customer_id UUID NOT NULL,
      provider_id UUID,
      overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
      would_recommend BOOLEAN,
      felt_safe BOOLEAN,
      felt_listened_to BOOLEAN,
      visit_length TEXT,
      what_helped TEXT,
      improvements TEXT,
      would_book_again BOOLEAN,
      emotional_state TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Insert survey
    const [survey] = await sql`INSERT INTO faith_satisfaction_surveys
      (booking_id, customer_id, provider_id, overall_rating, would_recommend, felt_safe, felt_listened_to, visit_length, what_helped, improvements, would_book_again, emotional_state)
      VALUES (${bookingId}, ${session.userId}, ${booking.provider_id}, ${overallRating}, ${wouldRecommend ?? null}, ${feltSafe ?? null}, ${feltListenedTo ?? null}, ${visitLength || null}, ${whatHelped || null}, ${improvements || null}, ${wouldBookAgain ?? null}, ${emotionalState || null})
      ON CONFLICT (booking_id) DO UPDATE SET overall_rating = EXCLUDED.overall_rating, would_recommend = EXCLUDED.would_recommend, felt_safe = EXCLUDED.felt_safe, felt_listened_to = EXCLUDED.felt_listened_to
      RETURNING id`;

    // Also insert into reviews table for volunteer's public rating
    try {
      await sql`INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment, status)
        VALUES (${bookingId}, ${session.userId}, ${booking.provider_id}, ${overallRating}, ${whatHelped || null}, 'published')
        ON CONFLICT (booking_id, customer_id) DO UPDATE SET rating = EXCLUDED.rating`;
    } catch {}

    await sql.end();
    return NextResponse.json({
      success: true,
      surveyId: survey.id,
      message: "Thank you for your feedback! Your input helps us serve you better.",
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
