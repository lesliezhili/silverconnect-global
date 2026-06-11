import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema/payments";
import { bookings } from "@/lib/db/schema/bookings";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events (payment confirmations, failures, etc.)
 *
 * Setup in Stripe Dashboard:
 * 1. Go to https://dashboard.stripe.com/test/webhooks
 * 2. Add endpoint: https://silverconnect-global.vercel.app/api/webhooks/stripe
 * 3. Select events: payment_intent.succeeded, payment_intent.payment_failed
 * 4. Copy signing secret → set STRIPE_WEBHOOK_SECRET in Vercel env
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If no webhook secret, log and accept (for testing without signature verification)
  if (!webhookSecret) {
    console.log("[Stripe Webhook] No STRIPE_WEBHOOK_SECRET set — accepting without verification");
    try {
      const event = JSON.parse(body);
      await handleEvent(event);
    } catch (e) {
      console.error("[Stripe Webhook] Parse error:", e);
    }
    return NextResponse.json({ received: true, verified: false });
  }

  // Verify signature
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: any;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" as any });
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

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${type}`);
  }
}
