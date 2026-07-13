import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { donations } from "@/lib/db/schema/donations";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/donations/create-intent
 * Public — no sign-in required. General platform donation, not tied to
 * any booking or person.
 * Body: { amount, currency?, donorName?, donorEmail?, message?, anonymous? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amount, currency, donorName, donorEmail, message, anonymous } = body;

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: "A positive donation amount is required" }, { status: 400 });
  }

  const me = await getCurrentUser();
  const resolvedCurrency = String(currency || "AUD").toLowerCase();
  const amountCents = Math.round(numericAmount * 100);

  const resolvedName = anonymous ? null : (donorName?.trim() || me?.name || null);
  const resolvedEmail = donorEmail?.trim() || me?.email || null;

  if (isStripeConfigured()) {
    const stripe = getStripeClient();

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: resolvedCurrency,
      metadata: {
        donation_id: "", // filled in after insert below
        donor_id: me?.id || "",
      },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: "SilverConnect Donation",
    });

    const [row] = await db
      .insert(donations)
      .values({
        donorUserId: me?.id,
        donorName: resolvedName,
        donorEmail: resolvedEmail,
        amount: numericAmount.toFixed(2),
        currency: resolvedCurrency.toUpperCase(),
        message: message?.trim() || null,
        isAnonymous: Boolean(anonymous),
        stripePaymentIntentId: pi.id,
        status: "pending",
      })
      .returning({ id: donations.id });

    // Stripe metadata can't be set before the row exists (we need its id) —
    // update it now that we have both.
    await stripe.paymentIntents.update(pi.id, { metadata: { donation_id: row.id, donor_id: me?.id || "" } });

    return NextResponse.json({
      clientSecret: pi.client_secret,
      donationId: row.id,
    });
  }

  // Simulated mode (Stripe not configured) — matches the existing
  // fallback shape in app/api/payments/create-intent/route.ts.
  const simId = `pi_sim_${Date.now()}`;
  const [row] = await db
    .insert(donations)
    .values({
      donorUserId: me?.id,
      donorName: resolvedName,
      donorEmail: resolvedEmail,
      amount: numericAmount.toFixed(2),
      currency: resolvedCurrency.toUpperCase(),
      message: message?.trim() || null,
      isAnonymous: Boolean(anonymous),
      stripePaymentIntentId: simId,
      status: "pending",
    })
    .returning({ id: donations.id });

  return NextResponse.json({
    clientSecret: `${simId}_secret_sim`,
    donationId: row.id,
    simulated: true,
  });
}
