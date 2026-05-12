import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getStripe } from "@/lib/donations/stripe";
import { db } from "@/lib/db";
import { providerProfiles } from "@/lib/db/schema/providers";
import { tryAutoApproveProvider } from "@/lib/provider/autoApprove";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe Connect webhook — listens for `account.updated` on connected
 * (provider) accounts. When an account becomes fully payout-enabled, this
 * may complete the provider's onboarding, so we re-run auto-approval.
 *
 * Configure in the Stripe Dashboard as a webhook endpoint with "Listen to
 * events on Connected accounts" and set `STRIPE_CONNECT_WEBHOOK_SECRET`.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/connect-webhook] STRIPE_CONNECT_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const raw = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/connect-webhook] signature failed:", message);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      const [p] = await db
        .select({ id: providerProfiles.id })
        .from(providerProfiles)
        .where(eq(providerProfiles.stripeAccountId, account.id))
        .limit(1);
      if (p) after(() => tryAutoApproveProvider(p.id));
    }
  }

  return NextResponse.json({ received: true });
}
