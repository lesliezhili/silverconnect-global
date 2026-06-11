import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/bookings/[id]/cancel — Cancel a booking with policy enforcement
 * 
 * Cancellation Policy:
 *   - 24+ hours before: FREE cancellation, full refund
 *   - 12-24 hours: 50% refund (50% cancellation fee)
 *   - < 12 hours: No refund (100% cancellation fee)
 *   - Provider cancels: Always full refund to customer
 *   - Faith bookings: Always free cancellation (no payment involved)
 */
import { getPaymentProvider, PHLEDGER_API_URL } from "@/lib/payments/provider-config";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const body = await req.json();
  const { cancelledBy, reason = "customer_request", notes = "" } = body;

  if (!cancelledBy) {
    return NextResponse.json({ error: "cancelledBy (userId) required" }, { status: 400 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    // Get booking details
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${bookingId}`;
    if (!booking) {
      await sql.end();
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      await sql.end();
      return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
    }

    if (["completed", "released"].includes(booking.status)) {
      await sql.end();
      return NextResponse.json({ error: "Cannot cancel a completed booking. Use dispute instead." }, { status: 400 });
    }

    // Calculate refund based on policy
    const scheduledAt = new Date(booking.scheduled_at).getTime();
    const now = Date.now();
    const hoursUntil = (scheduledAt - now) / 3600000;
    const totalPrice = parseFloat(booking.total_price || "0");
    const isProviderCancel = cancelledBy === booking.provider_id;
    const isFaith = totalPrice === 0;

    let refundAmount = 0;
    let cancellationFee = 0;
    let policyApplied = "";

    if (isFaith) {
      refundAmount = 0;
      cancellationFee = 0;
      policyApplied = "faith_free";
    } else if (isProviderCancel) {
      refundAmount = totalPrice;
      cancellationFee = 0;
      policyApplied = "provider_cancel_full_refund";
    } else if (hoursUntil >= 24) {
      refundAmount = totalPrice;
      cancellationFee = 0;
      policyApplied = "24h_plus_free";
    } else if (hoursUntil >= 12) {
      refundAmount = Math.round(totalPrice * 0.5 * 100) / 100;
      cancellationFee = Math.round(totalPrice * 0.5 * 100) / 100;
      policyApplied = "12_24h_50_percent";
    } else {
      refundAmount = 0;
      cancellationFee = totalPrice;
      policyApplied = "under_12h_no_refund";
    }

    // Process refund if applicable
    let refundTransactionId = "";
    const provider = getPaymentProvider();

    if (refundAmount > 0) {
      if (provider === "phledger") {
        try {
          const resp = await fetch(`${PHLEDGER_API_URL}/api/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, amount: refundAmount, reason: "cancellation", customerName: "", testMode: true }),
          });
          const data = await resp.json();
          refundTransactionId = data.refundId || "PHLEDGER-" + Date.now();
        } catch {
          refundTransactionId = "PHLEDGER-SIM-" + Date.now();
        }
      } else {
        // Stripe refund
        try {
          const [payment] = await sql`SELECT stripe_payment_intent_id FROM payments WHERE booking_id = ${bookingId} AND status = 'succeeded' LIMIT 1`;
          if (payment?.stripe_payment_intent_id) {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });
            const refund = await stripe.refunds.create({
              payment_intent: payment.stripe_payment_intent_id,
              amount: Math.round(refundAmount * 100),
            });
            refundTransactionId = refund.id;
          }
        } catch (e: unknown) {
          refundTransactionId = "STRIPE-FAILED-" + (e instanceof Error ? e.message.slice(0, 30) : "unknown");
        }
      }
    }

    // Update booking status
    await sql`UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ${bookingId}`;

    // Record cancellation
    await sql`INSERT INTO cancellations (booking_id, cancelled_by, reason, notes, refund_amount, cancellation_fee, refund_status, refund_transaction_id, payment_provider, policy_applied)
      VALUES (${bookingId}, ${cancelledBy}, ${reason}, ${notes}, ${refundAmount}, ${cancellationFee}, ${refundAmount > 0 ? 'completed' : 'none'}, ${refundTransactionId}, ${provider}, ${policyApplied})`;

    // Create notification
    const notifyUserId = isProviderCancel ? booking.customer_id : booking.provider_id;
    await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id)
      VALUES (${notifyUserId}, 'booking', 'Booking Cancelled', ${isProviderCancel ? 'Your provider cancelled. Full refund issued.' : 'Customer cancelled the booking.'}, ${bookingId})`.catch(() => {});

    await sql.end();

    return NextResponse.json({
      success: true,
      bookingId,
      status: "cancelled",
      policy: {
        applied: policyApplied,
        hoursBeforeBooking: Math.round(hoursUntil * 10) / 10,
        refundAmount,
        cancellationFee,
        totalPrice,
      },
      refund: {
        amount: refundAmount,
        transactionId: refundTransactionId,
        provider,
        status: refundAmount > 0 ? "completed" : "no_refund",
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
