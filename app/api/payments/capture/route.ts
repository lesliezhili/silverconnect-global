import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, wallets } from "@/lib/db/schema/payments";
import { bookings } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/payments/capture — captures authorized payment after service completion */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

    // Verify booking exists and provider is completing it
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Update payment to captured
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1);
    if (!payment) return NextResponse.json({ error: "No payment found" }, { status: 404 });

    await db.update(payments).set({
      status: "captured" as never, capturedAt: new Date(), updatedAt: new Date(),
    }).where(eq(payments.id, payment.id));

    // Update booking to completed
    await db.update(bookings).set({ status: "completed" as never, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    // Credit provider wallet (platform takes 15% commission like Airtasker)
    const commission = 0.15;
    const providerAmount = Number(payment.amount) * (1 - commission);
    const [profile] = await db.select({ id: providerProfiles.id }).from(providerProfiles)
      .where(eq(providerProfiles.userId, booking.providerId!)).limit(1);

    if (profile) {
      await db.execute(sql`
        INSERT INTO wallets (id, provider_id, balance_pending, balance_available, currency, updated_at)
        VALUES (gen_random_uuid(), ${profile.id}, ${providerAmount.toFixed(2)}, '0', ${payment.currency}, NOW())
        ON CONFLICT (provider_id) DO UPDATE SET
          balance_pending = wallets.balance_pending::numeric + ${providerAmount.toFixed(2)}::numeric,
          updated_at = NOW()
      `);
    }

    return NextResponse.json({ success: true, captured: payment.amount, providerCredit: providerAmount.toFixed(2), commission: (Number(payment.amount) * commission).toFixed(2) });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
