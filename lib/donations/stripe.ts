import "server-only";
import Stripe from "stripe";
import { absoluteUrl } from "./appUrl";
import type { DonateLocale } from "./schema";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key, {
    // Pin to a known API version so future Stripe upgrades don't silently
    // change webhook payloads.
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return cached;
}

export interface CreateCheckoutInput {
  donationId: string;
  campaignId: string;
  amountCents: number;
  mode: "once" | "monthly";
  locale: DonateLocale;
  donorEmail: string;
}

/**
 * Create a Stripe Checkout Session for a donation. Both single payment
 * and monthly subscription use `price_data` to avoid pre-creating Stripe
 * Prices in the dashboard.
 *
 * Returns `{ sessionId, url }`. Caller is responsible for writing
 * sessionId back to the donations row before returning the URL to the
 * client — that's the only way the webhook can later look up which
 * donation a session belongs to.
 */
export async function createCheckoutSession(
  input: CreateCheckoutInput,
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const isMonthly = input.mode === "monthly";

  const successUrl = absoluteUrl(
    `/${input.locale}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
  );
  const cancelUrl = absoluteUrl(`/${input.locale}/donate/cancel`);

  const session = await stripe.checkout.sessions.create({
    mode: isMonthly ? "subscription" : "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: input.amountCents,
          product_data: { name: "SilverConnect 公益捐款" },
          ...(isMonthly ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: input.donorEmail,
    metadata: {
      donationId: input.donationId,
      campaignId: input.campaignId,
    },
    // Mirror metadata onto the PI / Subscription so out-of-order webhook
    // events (e.g. invoice.paid arriving before checkout.session.completed)
    // can still resolve back to the originating donation.
    ...(isMonthly
      ? {
          subscription_data: {
            metadata: {
              donationId: input.donationId,
              campaignId: input.campaignId,
            },
          },
        }
      : {
          payment_intent_data: {
            metadata: {
              donationId: input.donationId,
              campaignId: input.campaignId,
            },
          },
        }),
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session has no url");
  }
  return { sessionId: session.id, url: session.url };
}
