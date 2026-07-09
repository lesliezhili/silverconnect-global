import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { payments, refunds } from "@/lib/db/schema/payments";
import { bookings } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { notifications } from "@/lib/db/schema/notifications";
import { eq } from "drizzle-orm";
import { getStripeClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (payment confirmations, failures, refunds, disputes, Connect status).
 *
 * Setup in Stripe Dashboard:
 * 1. Go to https://dashboard.stripe.com/test/webhooks
 * 2. Add endpoint: https://silverconnect-global.vercel.app/api/webhooks/stripe
 * 3. Select events: payment_intent.succeeded, payment_intent.payment_failed,
 *    charge.refunded, charge.dispute.created, account.updated
 * 4. Copy signing secret → set STRIPE_WEBHOOK_SECRET in Vercel env
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // A webhook that accepts unsigned bodies is not a webhook — it's a public
  // endpoint anyone can POST fake "payment succeeded" events to. Refuse to
  // run without both a secret and a signature rather than trusting the body.
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured — refusing request");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: any;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await handleEvent(event);
  return NextResponse.json({ received: true, verified: true });
}

async function handleEvent(event: any) {
  const type = event.type || event.data?.type;
  console.log(`[Stripe Webhook] Event: ${type}`);

  switch (type) {
    case "payment_intent.succeeded": {
      const pi = event.data?.object || event;
      const piId = pi.id;
      const bookingId = pi.metadata?.booking_id;

      console.log(`[Stripe] Payment succeeded: ${piId} for booking ${bookingId}`);

      // Update payment status
      await db.update(payments)
        .set({ status: "captured" as any })
        .where(eq(payments.stripePaymentIntentId, piId));

      // Update booking status
      if (bookingId) {
        await db.update(bookings)
          .set({ status: "confirmed" as any, updatedAt: new Date() })
          .where(eq(bookings.id, bookingId));
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data?.object || event;
      const piId = pi.id;

      console.log(`[Stripe] Payment failed: ${piId}`);
      await db.update(payments)
        .set({ status: "failed" as any })
        .where(eq(payments.stripePaymentIntentId, piId));
      break;
    }

    case "charge.refunded": {
      const charge = event.data?.object;
      const piId = charge?.payment_intent;
      if (!piId) break;

      const [payment] = await db.select().from(payments)
        .where(eq(payments.stripePaymentIntentId, piId)).limit(1);
      if (!payment) break;

      await db.update(payments).set({ status: "refunded" as any }).where(eq(payments.id, payment.id));

      const stripeRefundId = charge?.refunds?.data?.[0]?.id;
      if (stripeRefundId) {
        const [existing] = await db.select().from(refunds)
          .where(eq(refunds.stripeRefundId, stripeRefundId)).limit(1);
        if (!existing) {
          await db.insert(refunds).values({
            paymentId: payment.id,
            stripeRefundId,
            amount: String((charge.amount_refunded ?? 0) / 100),
            reason: "stripe_dashboard",
            status: "succeeded",
          });
        }
      }
      break;
    }

    case "charge.dispute.created": {
      // A cardholder chargeback via their bank — distinct from this app's own
      // customer/provider service disputes table. Flag it for admin attention.
      const stripeDispute = event.data?.object;
      const piId = stripeDispute?.payment_intent;
      console.error(`[Stripe] Chargeback opened on payment_intent ${piId}: ${stripeDispute?.reason}`);

      if (piId) {
        const [payment] = await db.select().from(payments)
          .where(eq(payments.stripePaymentIntentId, piId)).limit(1);
        if (payment) {
          const [booking] = await db.select().from(bookings)
            .where(eq(bookings.id, payment.bookingId)).limit(1);
          // No dedicated admin-broadcast table exists yet — this is logged
          // as an error so it surfaces in monitoring until one does.
          console.error(`[Stripe] Chargeback affects booking ${booking?.id ?? payment.bookingId}`);
        }
      }
      break;
    }

    case "account.updated": {
      const account = event.data?.object;
      const accountId = account?.id;
      if (!accountId) break;

      const [profile] = await db.select().from(providerProfiles)
        .where(eq(providerProfiles.stripeAccountId, accountId)).limit(1);
      if (!profile) break;

      const fullyOnboarded = Boolean(account?.charges_enabled && account?.payouts_enabled);
      console.log(`[Stripe] Connect account ${accountId} updated — fully onboarded: ${fullyOnboarded}`);

      if (fullyOnboarded) {
        await db.insert(notifications).values({
          userId: profile.userId,
          kind: "payment" as any,
          title: "Payouts are ready",
          body: "Your Stripe account is fully set up — you can now receive payouts for completed bookings.",
        });
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${type}`);
  }
}
