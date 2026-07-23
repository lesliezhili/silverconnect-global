import { NextRequest, NextResponse } from "next/server";
import { cancelBooking, CancelBookingError } from "@/lib/bookings/cancelBooking";

/**
 * POST /api/bookings/[id]/cancel — Cancel or end-early a booking.
 * Thin wrapper around lib/bookings/cancelBooking.ts, the single source
 * of truth for cancellation policy (also used by the customer and
 * provider server actions) — see that file for the actual policy.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const body = await req.json();
  const { cancelledBy, reason, notes } = body;

  if (!cancelledBy) {
    return NextResponse.json({ error: "cancelledBy (userId) required" }, { status: 400 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const result = await cancelBooking(sql, { bookingId, cancelledBy, reason, notes });
    await sql.end();
    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      status: "cancelled",
      policy: {
        applied: result.policyApplied,
        refundAmount: result.refundAmount,
        providerCompensation: result.providerCompensation,
        cancellationFee: result.cancellationFee,
        totalPrice: result.totalPrice,
      },
      refund: {
        amount: result.refundAmount,
        transactionId: result.refundTransactionId,
        status: result.refundAmount > 0 ? "completed" : "no_refund",
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    if (err instanceof CancelBookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
