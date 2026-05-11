import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/donations/stripe";
import {
  claimEvent,
  finalizeEventSucceeded,
  finalizeEventFailed,
} from "@/lib/donations/events";
import {
  findDonationBySessionId,
  findDonationBySubscriptionId,
  findDonationById,
  markDonationCompleted,
  activateSubscription,
  cancelSubscription,
  recordPayment,
  applyRefundCreated,
  syncChargeRefunded,
} from "@/lib/donations/repository";
import { sendDonationThanks } from "@/lib/donations/thanksEmail";
import { db } from "@/lib/db";
import { donations } from "@/lib/db/schema/donations";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 400 },
    );
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Stripe needs the *raw* body to verify the signature; never JSON.parse before this.
  const raw = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] signature failed:", message);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // ① CLAIM
  const claim = await claimEvent(event.id, event.type);
  if (claim === "duplicate-succeeded") {
    return NextResponse.json({ received: true, dedup: true });
  }
  if (claim === "in-progress") {
    return NextResponse.json(
      { error: "in_progress" },
      { status: 409 },
    );
  }

  // ②③ BUSINESS + POST-COMMIT
  try {
    await dispatch(stripe, event);
    await finalizeEventSucceeded(event.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe/webhook] ${event.type} ${event.id} failed:`, message);
    await finalizeEventFailed(event.id, message);
    // 5xx so Stripe retries; on retry, claim() will reclaim because status='failed'.
    return NextResponse.json(
      { error: "handler_failed", message },
      { status: 500 },
    );
  }
}

async function dispatch(stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
    case "invoice.paid":
      return handleInvoicePaid(stripe, event.data.object as Stripe.Invoice);
    case "invoice.payment_failed":
      return handleInvoiceFailed(event.data.object as Stripe.Invoice);
    case "refund.created":
      return handleRefundCreated(event.data.object as Stripe.Refund);
    case "charge.refunded":
      return handleChargeRefunded(event.data.object as Stripe.Charge);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    default:
      // Unknown event type: log and succeed so Stripe doesn't retry forever.
      console.info(`[stripe/webhook] ignoring ${event.type}`);
      return;
  }
}

// ---------------------------------------------------------------- handlers

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const donation = await findDonationBySessionId(session.id);
  if (!donation) {
    console.warn(`[stripe/webhook] checkout.session.completed ${session.id} has no donation row`);
    return;
  }

  if (session.mode === "payment") {
    await markDonationCompleted(session.id);
    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    if (!piId) {
      throw new Error(`session ${session.id} has no payment_intent`);
    }
    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["latest_charge"],
    });
    const charge = pi.latest_charge as Stripe.Charge | null;

    const result = await recordPayment({
      donationId: donation.id,
      campaignId: donation.campaignId,
      amountCents: session.amount_total ?? donation.amountCents,
      currency: (session.currency ?? donation.currency).toLowerCase(),
      stripePaymentIntentId: piId,
      stripeInvoiceId: null,
      stripeChargeId: charge?.id ?? null,
      receiptUrl: charge?.receipt_url ?? null,
      billingReason: "manual",
      capturedAt: new Date((pi.created ?? Math.floor(Date.now() / 1000)) * 1000),
    });

    if (result.inserted) {
      await sendDonationThanks({
        to: donation.donorEmail,
        donorName: donation.donorName,
        amountCents: session.amount_total ?? donation.amountCents,
        currency: (session.currency ?? donation.currency).toLowerCase(),
        isMonthly: false,
        receiptUrl: charge?.receipt_url ?? null,
        locale: donation.locale,
      });
    }
    return;
  }

  // mode === "subscription"
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  if (!customerId || !subId) {
    throw new Error(`subscription session ${session.id} missing customer/subscription`);
  }
  await activateSubscription(session.id, customerId, subId);
  // First-cycle payment will arrive via invoice.paid; do nothing else here.
}

async function handleInvoicePaid(
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;
  if (!subId) {
    // Not a subscription invoice — donations don't use one-off invoices.
    return;
  }

  // Out-of-order safety: invoice.paid can arrive before checkout.session.completed.
  let donation = await findDonationBySubscriptionId(subId);
  if (!donation) {
    const sub = await stripe.subscriptions.retrieve(subId);
    const fallbackId = sub.metadata?.donationId;
    if (fallbackId) {
      donation = await findDonationById(fallbackId);
      if (donation) {
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await db
          .update(donations)
          .set({
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId,
            updatedAt: new Date(),
          })
          .where(eq(donations.id, donation.id));
      }
    }
  }
  if (!donation) {
    // Silent return would lose this charge from progress forever. Throw so
    // Stripe retries (3-day window). If both lookups failed, the originating
    // Checkout was never created from our flow — that's an integrity bug
    // worth surfacing in logs.
    throw new Error(
      `invoice.paid sub=${subId} could not resolve donation (no row by subscription_id, and no usable subscription.metadata.donationId)`,
    );
  }

  const piId =
    typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id ?? null;
  let chargeId: string | null = null;
  let receiptUrl: string | null = null;
  if (piId) {
    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["latest_charge"],
    });
    const charge = pi.latest_charge as Stripe.Charge | null;
    chargeId = charge?.id ?? null;
    receiptUrl = charge?.receipt_url ?? null;
  }

  const result = await recordPayment({
    donationId: donation.id,
    campaignId: donation.campaignId,
    amountCents: invoice.amount_paid,
    currency: (invoice.currency ?? donation.currency).toLowerCase(),
    stripePaymentIntentId: piId,
    stripeInvoiceId: invoice.id ?? null,
    stripeChargeId: chargeId,
    receiptUrl,
    billingReason: invoice.billing_reason ?? null,
    capturedAt: new Date((invoice.status_transitions?.paid_at ?? invoice.created ?? Math.floor(Date.now() / 1000)) * 1000),
  });

  if (result.inserted) {
    await sendDonationThanks({
      to: donation.donorEmail,
      donorName: donation.donorName,
      amountCents: invoice.amount_paid,
      currency: (invoice.currency ?? donation.currency).toLowerCase(),
      isMonthly: true,
      receiptUrl,
      locale: donation.locale,
    });
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  console.warn(
    `[stripe/webhook] invoice.payment_failed invoice=${invoice.id} sub=${
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id
    }`,
  );
  // Stripe handles dunning + retries; donations.status stays 'active' until
  // customer.subscription.deleted explicitly cancels.
}

async function handleRefundCreated(refund: Stripe.Refund): Promise<void> {
  const piId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : refund.payment_intent?.id ?? null;
  const chargeId =
    typeof refund.charge === "string" ? refund.charge : refund.charge?.id ?? null;
  await applyRefundCreated({
    paymentIntentId: piId,
    chargeId,
    refundId: refund.id,
    refundAmountCents: refund.amount,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;
  await syncChargeRefunded({
    paymentIntentId: piId,
    chargeId: charge.id,
    chargeAmountRefundedCents: charge.amount_refunded,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  await cancelSubscription(sub.id);
}
