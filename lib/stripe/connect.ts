import "server-only";
import { getStripe } from "@/lib/donations/stripe";

/**
 * Stripe Connect (Express) onboarding for service providers — the path that
 * lets the platform pay providers out. Uses the same `STRIPE_SECRET_KEY` as
 * the donation flow (live keys per project decision).
 */

/** Create the connected account if the provider doesn't have one yet; return its id. */
export async function ensureConnectAccount(opts: {
  existingAccountId: string | null;
  email: string;
  country: string; // ISO-2: "AU" | "US" | "CA"
}): Promise<string> {
  if (opts.existingAccountId) return opts.existingAccountId;
  const stripe = getStripe();
  // business_type and the rest of the profile are collected in Stripe's
  // hosted onboarding flow — don't pre-set it here (it can lock the value).
  const account = await stripe.accounts.create({
    type: "express",
    email: opts.email,
    country: opts.country,
    capabilities: { transfers: { requested: true } },
  });
  return account.id;
}

/** Generate a one-time hosted onboarding link for the connected account. */
export async function createConnectOnboardingLink(opts: {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: opts.accountId,
    return_url: opts.returnUrl,
    refresh_url: opts.refreshUrl,
    type: "account_onboarding",
  });
  return link.url;
}

/** True once the connected account can accept transfers/payouts. */
export async function isConnectPayoutsEnabled(accountId: string): Promise<boolean> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return Boolean(
    account.details_submitted && account.charges_enabled && account.payouts_enabled,
  );
}
