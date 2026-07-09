import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider, PHLEDGER_API_URL } from "@/lib/payments/provider-config";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * GET /api/admin/disputes — List all disputes (admin view)
 * POST /api/admin/disputes — Resolve a dispute
 *
 * Body: { disputeId, resolution, refundType, refundAmount?, resolvedBy }
 * refundType: "full" | "partial" | "none"
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const disputes = await sql`
      SELECT d.*, b.total_price, b.scheduled_at, b.status as booking_status,
        c.name as customer_name, c.email as customer_email,
        p.name as provider_name, p.email as provider_email
      FROM disputes d
      JOIN bookings b ON d.booking_id = b.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      ORDER BY d.created_at DESC
      LIMIT 50
    `;
    await sql.end();

    return NextResponse.json({
      success: true,
      total: disputes.length,
      disputes: disputes.map(d => ({
        id: d.id,
        bookingId: d.booking_id,
        status: d.status,
        reason: d.reason,
        description: d.description,
        totalPrice: d.total_price,
        refundAmount: d.refund_amount,
        customerName: d.customer_name,
        providerName: d.provider_name,
        createdAt: d.created_at,
        resolvedAt: d.resolved_at,
      })),
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { disputeId, resolution, refundType, refundAmount: customRefundAmount, resolvedBy } = body;

  if (!disputeId || !resolution || !refundType || !resolvedBy) {
    return NextResponse.json({ error: "disputeId, resolution, refundType, resolvedBy required" }, { status: 400 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    // Get dispute + booking
    const [dispute] = await sql`SELECT d.*, b.total_price, b.customer_id, b.provider_id FROM disputes d JOIN bookings b ON d.booking_id = b.id WHERE d.id = ${disputeId}`;
    if (!dispute) {
      await sql.end();
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (["resolved_refund_full", "resolved_refund_partial", "resolved_rejected", "closed"].includes(dispute.status)) {
      await sql.end();
      return NextResponse.json({ error: "Dispute already resolved" }, { status: 400 });
    }

    const totalPrice = parseFloat(dispute.total_price || "0");
    let refundAmount = 0;
    let newStatus = "closed";

    switch (refundType) {
      case "full":
        refundAmount = totalPrice;
        newStatus = "resolved_refund_full";
        break;
      case "partial":
        refundAmount = customRefundAmount || Math.round(totalPrice * 0.5 * 100) / 100;
        newStatus = "resolved_refund_partial";
        break;
      case "none":
        refundAmount = 0;
        newStatus = "resolved_rejected";
        break;
    }

    // Execute refund
    let refundTransactionId = "";
    const provider = getPaymentProvider();

    if (refundAmount > 0) {
      if (provider === "phledger") {
        try {
          const resp = await fetch(`${PHLEDGER_API_URL}/api/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: dispute.booking_id, amount: refundAmount, reason: `dispute_${refundType}`, customerName: "", testMode: true }),
          });
          const data = await resp.json();
          refundTransactionId = data.refundId || "";

          // Also create credit note
          await fetch(`${PHLEDGER_API_URL}/api/credit-note`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: dispute.booking_id, amount: refundAmount, reason: resolution, originalInvoice: "" }),
          }).catch(() => {});
        } catch {
          refundTransactionId = "PHLEDGER-SIM-" + Date.now();
        }
      } else {
        // Stripe refund
        try {
          const [payment] = await sql`SELECT id, stripe_payment_intent_id FROM payments WHERE booking_id = ${dispute.booking_id} AND status = 'captured' LIMIT 1`;
          if (payment?.stripe_payment_intent_id && isStripeConfigured()) {
            const stripe = getStripeClient();
            const refund = await stripe.refunds.create({
              payment_intent: payment.stripe_payment_intent_id,
              amount: Math.round(refundAmount * 100),
            });
            refundTransactionId = refund.id;
            await sql`UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE id = ${payment.id}`;
            await sql`INSERT INTO refunds (payment_id, stripe_refund_id, amount, reason, status) VALUES (${payment.id}, ${refund.id}, ${refundAmount}, 'dispute', 'succeeded')`;
          } else if (payment?.stripe_payment_intent_id) {
            refundTransactionId = `STRIPE-SIM-${Date.now()}`;
            await sql`INSERT INTO refunds (payment_id, amount, reason, status) VALUES (${payment.id}, ${refundAmount}, 'dispute', 'pending')`;
          }
        } catch (e: unknown) {
          refundTransactionId = "STRIPE-ERR-" + (e instanceof Error ? e.message.slice(0, 30) : "");
        }
      }
    }

    // Update dispute
    await sql`UPDATE disputes SET status = ${newStatus}, resolution = ${resolution}, refund_amount = ${refundAmount}, refund_type = ${refundType}, resolved_by = ${resolvedBy}, resolved_at = NOW(), payment_provider = ${provider}, refund_transaction_id = ${refundTransactionId}, updated_at = NOW() WHERE id = ${disputeId}`;

    // Update booking status back from disputed
    if (refundType === "none") {
      await sql`UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = ${dispute.booking_id}`;
    } else {
      await sql`UPDATE bookings SET status = 'released', updated_at = NOW() WHERE id = ${dispute.booking_id}`;
    }

    // Notify both parties
    await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id) VALUES
      (${dispute.customer_id}, 'booking', 'Dispute Resolved', ${'Your dispute has been resolved. ' + (refundAmount > 0 ? 'Refund: $' + refundAmount : 'No refund issued.')}, ${dispute.booking_id})`.catch(() => {});
    await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id) VALUES
      (${dispute.provider_id}, 'booking', 'Dispute Resolved', ${'A dispute on your booking has been resolved by admin.'}, ${dispute.booking_id})`.catch(() => {});

    await sql.end();

    return NextResponse.json({
      success: true,
      dispute: {
        id: disputeId,
        status: newStatus,
        resolution,
        refundType,
        refundAmount,
        refundTransactionId,
        provider,
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
