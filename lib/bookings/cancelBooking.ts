import "server-only";
import { calculateCancellationQuote } from "./cancellation";
import { getPaymentProvider, PHLEDGER_API_URL } from "@/lib/payments/provider-config";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

/**
 * Single source of truth for "what happens when a booking gets
 * cancelled or ended early" — policy, refund, and provider compensation.
 * Called from every real cancellation entry point (customer cancel
 * action, provider decline/cancel action, and the standalone API route)
 * so they can never drift out of sync with each other again.
 *
 * Two distinct policies for two distinct situations:
 *  - Not yet started (pending/confirmed): notice-period-based tiers from
 *    ./cancellation.ts's calculateCancellationQuote — country-aware
 *    (AU/CN/CA). A provider-initiated cancellation always fully refunds
 *    the customer regardless of notice period — not their fault.
 *  - Already in progress (status = 'in_progress'): prorated by elapsed
 *    time against started_at. The provider is compensated for time
 *    actually worked; the customer is refunded the unused remainder,
 *    regardless of who ends it early — the provider did real work
 *    either way, and the customer shouldn't pay for time not delivered
 *    either way.
 *  - Faith/volunteer bookings ($0): always free, no money moves.
 */

type SqlClient = import("postgres").Sql;

export interface CancelBookingResult {
  success: true;
  bookingId: string;
  policyApplied: string;
  refundAmount: number;
  providerCompensation: number;
  cancellationFee: number;
  totalPrice: number;
  refundTransactionId: string;
}

export class CancelBookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function cancelBooking(
  sql: SqlClient,
  { bookingId, cancelledBy, reason = "customer_request", notes = "" }: { bookingId: string; cancelledBy: string; reason?: string; notes?: string },
): Promise<CancelBookingResult> {
  // cancellations.cancelled_by is a FK to users.id, so the caller must
  // always pass a user id — including for a provider-initiated
  // cancellation, where it's the provider's *user* id, not their
  // provider_profiles.id (bookings.provider_id references the latter).
  // Joining provider_profiles here is what makes the isProviderCancel
  // check line up with what's actually allowed into the FK.
  const [booking] = await sql`
    SELECT b.*, u.country AS customer_country, pp.user_id AS provider_user_id
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    LEFT JOIN provider_profiles pp ON pp.id = b.provider_id
    WHERE b.id = ${bookingId}`;
  if (!booking) throw new CancelBookingError("Booking not found", 404);
  if (booking.status === "cancelled") throw new CancelBookingError("Booking already cancelled");
  if (["completed", "released"].includes(booking.status)) {
    throw new CancelBookingError("Cannot cancel a completed booking. Use dispute instead.");
  }

  const totalPrice = parseFloat(booking.total_price || "0");
  const isProviderCancel = cancelledBy === booking.provider_user_id;
  const isFaith = totalPrice === 0;

  let refundAmount = 0;
  let providerCompensation = 0;
  let cancellationFee = 0;
  let policyApplied = "";

  if (isFaith) {
    refundAmount = 0;
    providerCompensation = 0;
    cancellationFee = 0;
    policyApplied = "faith_free";
  } else if (booking.status === "in_progress" && booking.started_at) {
    const startedAtMs = new Date(booking.started_at).getTime();
    const plannedDurationMs = (booking.duration_min || 60) * 60000;
    const elapsedMs = Math.max(0, Math.min(Date.now() - startedAtMs, plannedDurationMs));
    const elapsedFraction = plannedDurationMs > 0 ? elapsedMs / plannedDurationMs : 0;
    providerCompensation = Math.round(totalPrice * elapsedFraction * 100) / 100;
    refundAmount = Math.round((totalPrice - providerCompensation) * 100) / 100;
    cancellationFee = 0;
    policyApplied = isProviderCancel ? "in_progress_provider_stopped" : "in_progress_customer_stopped";
  } else if (isProviderCancel) {
    refundAmount = totalPrice;
    providerCompensation = 0;
    cancellationFee = 0;
    policyApplied = "provider_cancel_full_refund";
  } else {
    const quote = calculateCancellationQuote({
      bookingId,
      totalAmount: totalPrice,
      serviceDate: new Date(booking.scheduled_at),
      country: booking.customer_country || "AU",
      isNoShow: reason === "no_show",
    });
    refundAmount = quote.refundAmount;
    providerCompensation = quote.providerCompensation;
    cancellationFee = quote.platformFee;
    policyApplied = quote.noticePeriod + (reason === "no_show" ? "_no_show" : "");
  }

  let refundTransactionId = "";
  const paymentProvider = getPaymentProvider();

  if (refundAmount > 0) {
    if (paymentProvider === "phledger") {
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
      try {
        const [payment] = await sql`SELECT id, stripe_payment_intent_id FROM payments WHERE booking_id = ${bookingId} AND status = 'captured' LIMIT 1`;
        if (payment?.stripe_payment_intent_id && isStripeConfigured()) {
          const stripe = getStripeClient();
          const refund = await stripe.refunds.create({
            payment_intent: payment.stripe_payment_intent_id,
            amount: Math.round(refundAmount * 100),
          });
          refundTransactionId = refund.id;
          await sql`UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE id = ${payment.id}`;
          await sql`INSERT INTO refunds (payment_id, stripe_refund_id, amount, reason, status) VALUES (${payment.id}, ${refund.id}, ${refundAmount}, 'cancellation', 'succeeded')`;
        } else if (payment?.stripe_payment_intent_id) {
          refundTransactionId = `STRIPE-SIM-${Date.now()}`;
          await sql`INSERT INTO refunds (payment_id, amount, reason, status) VALUES (${payment.id}, ${refundAmount}, 'cancellation', 'pending')`;
        }
      } catch (e: unknown) {
        refundTransactionId = "STRIPE-FAILED-" + (e instanceof Error ? e.message.slice(0, 30) : "unknown");
      }
    }
  }

  // Atomic: the booking's cancelled status, its audit row, and the
  // provider's wallet credit must all land together or not at all — an
  // earlier version left bookings silently marked "cancelled" with no
  // cancellations row when the last statement in this sequence failed,
  // because each `await sql\`...\`` was its own auto-committed statement.
  await sql.begin(async (tx) => {
    if (providerCompensation > 0) {
      await tx`
        INSERT INTO wallets (id, provider_id, balance_available, balance_pending, currency, updated_at)
        VALUES (gen_random_uuid(), ${booking.provider_id}, ${providerCompensation}, '0', ${booking.currency || 'AUD'}, NOW())
        ON CONFLICT (provider_id)
        DO UPDATE SET
          balance_available = wallets.balance_available + ${providerCompensation},
          updated_at = NOW()
      `;
    }

    await tx`UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ${bookingId}`;

    await tx`INSERT INTO cancellations (booking_id, cancelled_by, reason, notes, refund_amount, cancellation_fee, provider_compensation, refund_status, refund_transaction_id, payment_provider, policy_applied)
      VALUES (${bookingId}, ${cancelledBy}, ${reason}, ${notes}, ${refundAmount}, ${cancellationFee}, ${providerCompensation}, ${refundAmount > 0 ? 'completed' : 'none'}, ${refundTransactionId}, ${paymentProvider}, ${policyApplied})`;
  });

  const notifyUserId = isProviderCancel ? booking.customer_id : booking.provider_id;
  const notifyBody = isProviderCancel
    ? "Your provider cancelled. Full refund issued."
    : providerCompensation > 0
      ? `Customer cancelled the booking. You've been compensated $${providerCompensation.toFixed(2)} for work completed.`
      : "Customer cancelled the booking.";
  await sql`INSERT INTO notifications (user_id, kind, title, body, related_booking_id)
    VALUES (${notifyUserId}, 'booking', 'Booking Cancelled', ${notifyBody}, ${bookingId})`.catch(() => {});

  return {
    success: true,
    bookingId,
    policyApplied,
    refundAmount,
    providerCompensation,
    cancellationFee,
    totalPrice,
    refundTransactionId,
  };
}
