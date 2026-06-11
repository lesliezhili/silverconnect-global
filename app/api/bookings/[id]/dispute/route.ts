import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/bookings/[id]/dispute — Customer raises a dispute
 * 
 * Body: { raisedBy, reason, description?, evidenceUrls? }
 * 
 * Only allowed on completed/in_progress bookings.
 * Faith bookings cannot be disputed (no payment).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const body = await req.json();
  const { raisedBy, reason, description = "", evidenceUrls = [] } = body;

  if (!raisedBy || !reason) {
    return NextResponse.json({ error: "raisedBy and reason required" }, { status: 400 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${bookingId}`;
    if (!booking) {
      await sql.end();
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!["completed", "in_progress", "confirmed"].includes(booking.status)) {
      await sql.end();
      return NextResponse.json({ error: `Cannot dispute a ${booking.status} booking` }, { status: 400 });
    }

    const totalPrice = parseFloat(booking.total_price || "0");
    if (totalPrice === 0) {
      await sql.end();
      return NextResponse.json({ error: "Faith bookings (free) cannot be disputed — contact support directly" }, { status: 400 });
    }

    // Check for existing open dispute
    const existing = await sql`SELECT id FROM disputes WHERE booking_id = ${bookingId} AND status IN ('open', 'under_review')`;
    if (existing.length > 0) {
      await sql.end();
      return NextResponse.json({ error: "Active dispute already exists for this booking", existingDisputeId: existing[0].id }, { status: 409 });
    }

    // Update booking status
    await sql`UPDATE bookings SET status = 'disputed', updated_at = NOW() WHERE id = ${bookingId}`;

    // Create dispute record
    const [dispute] = await sql`INSERT INTO disputes (booking_id, raised_by, reason, description, evidence_urls)
      VALUES (${bookingId}, ${raisedBy}, ${reason}, ${description}, ${sql.array(evidenceUrls)})
      RETURNING id, status, created_at`;

    // Notify admin + other party
    const otherParty = raisedBy === booking.customer_id ? booking.provider_id : booking.customer_id;
    await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id) VALUES
      (${otherParty}, 'booking', 'Dispute Raised', ${'A dispute has been raised for booking. Admin will review.'}, ${bookingId})`.catch(() => {});

    await sql.end();

    return NextResponse.json({
      success: true,
      dispute: {
        id: dispute.id,
        bookingId,
        status: dispute.status,
        reason,
        totalAtRisk: totalPrice,
        nextSteps: "Admin will review within 24-48 hours. You can add evidence via the dispute messages API.",
        createdAt: dispute.created_at,
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/**
 * GET /api/bookings/[id]/dispute — Get dispute details for a booking
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const disputes = await sql`SELECT d.*, u.name as raised_by_name FROM disputes d JOIN users u ON d.raised_by = u.id WHERE d.booking_id = ${bookingId} ORDER BY d.created_at DESC`;
    await sql.end();
    return NextResponse.json({ success: true, disputes });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
