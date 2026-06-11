import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { payments } from "@/lib/db/schema/payments";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const PLATFORM_FEE_PERCENT = 15;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  // Get booking
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const amountCents = Math.round(Number(booking.totalPrice) * 100);
  const currency = (booking.currency || "AUD").toLowerCase();
  const platformFee = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (stripeKey && stripeKey.startsWith("sk_test_")) {
    // Real Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" as any });

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        booking_id: bookingId,
        customer_id: user.id,
        provider_id: booking.providerId || "",
        platform_fee: String(platformFee),
      },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: `SilverConnect Booking ${bookingId.slice(0, 8)}`,
    });

    // Record payment
    await db.insert(payments).values({
      bookingId,
      stripePaymentIntentId: pi.id,
      amount: booking.totalPrice!,
      currency: currency.toUpperCase(),
      status: "pending" as any,
    } as any).onConflictDoNothing();

    return NextResponse.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      amount: amountCents,
      currency,
      platformFee,
      providerAmount: amountCents - platformFee,
    });
  } else {
    // Simulated mode
    const simId = `pi_sim_${Date.now()}`;
    return NextResponse.json({
      clientSecret: `${simId}_secret_sim`,
      paymentIntentId: simId,
      amount: amountCents,
      currency,
      platformFee,
      providerAmount: amountCents - platformFee,
      simulated: true,
    });
  }
}
