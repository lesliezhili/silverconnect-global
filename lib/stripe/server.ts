import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-02-24.acacia";

let client: Stripe | null = null;

/** True once a Stripe secret key (test or live) is present — real Stripe calls should be made. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True only for live-mode keys. Use this for behavior that must differ between test and live (e.g. auto-confirming with Stripe's test payment methods), not to decide whether to call Stripe at all. */
export function isStripeLiveMode(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_"));
}

/** Throws if STRIPE_SECRET_KEY is unset — callers on simulated fallback paths must check isStripeConfigured() first. */
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!client) {
    client = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  }
  return client;
}
