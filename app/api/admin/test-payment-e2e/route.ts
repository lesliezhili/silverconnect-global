import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { payments } from "@/lib/db/schema/payments";
import { providerProfiles } from "@/lib/db/schema/providers";
import { services } from "@/lib/db/schema/services";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-payment-e2e
 * Creates a test booking + real/simulated Stripe PaymentIntent.
 */
export async function POST() {
  try {
    const customerId = "37ed768b-5770-46e6-851d-b605eae5f884"; // Margaret Chen

    // Get provider profile ID (references provider_profiles.id, not users.id)
    const [provProfile] = await db.select({ id: providerProfiles.id })
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, "d73656c1-bde8-47cf-a86b-924453f88072"))
      .limit(1);

    // Get any service ID from the services table
    const [service] = await db.select({ id: services.id })
      .from(services).limit(1);

    if (!service) {
      return NextResponse.json({ error: "No services in DB. Run /api/admin/seed-services first." }, { status: 400 });
    }

    const bookingId = randomUUID();
    const basePrice = "78.26"; // $45/hr x 2hrs x 1.0 (no surcharge weekday)
    const taxAmount = "11.74"; // 15% platform fee (not GST)
    const totalPrice = "90.00";
    const currency = "AUD";

    await db.insert(bookings).values({
      id: bookingId,
      customerId,
      providerId: provProfile?.id || null,
      serviceId: service.id,
      scheduledAt: new Date("2026-06-05T10:00:00+08:00"),
      durationMin: 120,
      status: "pending" as any,
      notes: "E2E Stripe payment test",
      basePrice,
      taxAmount,
      totalPrice,
      currency,
    });

    // Create Stripe PaymentIntent
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let paymentResult: any;

    if (stripeKey && stripeKey.startsWith("sk_test_")) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" as any });

      const amountCents = Math.round(Number(totalPrice) * 100);
      const platformFee = Math.round(amountCents * 0.15);

      const pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        metadata: { booking_id: bookingId, customer_id: customerId, test: "true" },
        automatic_payment_methods: { enabled: true },
        description: "SilverConnect E2E Test: Cleaning 2hrs",
      });

      await db.insert(payments).values({
        bookingId,
        stripePaymentIntentId: pi.id,
        amount: totalPrice,
        currency,
        status: "pending" as any,
      } as any);

      paymentResult = {
        mode: "REAL_STRIPE_TEST",
        paymentIntentId: pi.id,
        clientSecret: pi.client_secret,
        amount: amountCents,
        currency: "aud",
        platformFee,
        providerAmount: amountCents - platformFee,
        status: pi.status,
        dashboardUrl: `https://dashboard.stripe.com/test/payments/${pi.id}`,
      };
    } else {
      const piId = `pi_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
      await db.insert(payments).values({
        bookingId,
        stripePaymentIntentId: piId,
        amount: totalPrice,
        currency,
        status: "pending" as any,
      } as any);

      paymentResult = {
        mode: "SIMULATED — add STRIPE_SECRET_KEY (sk_test_*) to Vercel for real payments",
        paymentIntentId: piId,
        amount: 9000,
        currency: "aud",
        platformFee: 1350,
        providerAmount: 7650,
      };
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        customer: "Margaret Chen",
        provider: "Sarah Johnson",
        service: "Cleaning — 2 hours",
        total: "$90.00 AUD",
        date: "2026-06-05 10:00 AM AWST",
      },
      payment: paymentResult,
      testCard: { number: "4242 4242 4242 4242", expiry: "12/28", cvc: "123" },
      webhookSetup: {
        url: "https://silverconnect-global.vercel.app/api/webhooks/stripe",
        events: ["payment_intent.succeeded", "payment_intent.payment_failed"],
        dashboard: "https://dashboard.stripe.com/test/webhooks",
      },
    });
  } catch (e: unknown) {
    console.error("[test-payment-e2e]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
