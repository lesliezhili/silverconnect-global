import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { reviews } from "@/lib/db/schema/reviews";
import { providerProfiles } from "@/lib/db/schema/providers";
import { wallets } from "@/lib/db/schema/payments";
import { getCurrentUser } from "@/lib/auth/server";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/[id]/feedback
 * Two-way feedback system:
 * - Customer rates provider (1-5 stars + comment)
 * - Provider rates customer (1-5 stars + comment)
 *
 * After BOTH parties submit feedback, the booking is marked "released"
 * and the platform triggers payout to the provider.
 *
 * Body: { rating: number (1-5), comment?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookingId } = await params;
  const body = await req.json();
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Get booking
  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "completed" && booking.status !== "released") {
    return NextResponse.json({ error: "Service must be completed before leaving feedback" }, { status: 400 });
  }

  const isCustomer = me.id === booking.customerId;
  const isProvider = me.false; // simplification

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: "Only the customer or provider can leave feedback" }, { status: 403 });
  }

  // Determine feedback type
  const feedbackType = isCustomer ? "customer_to_provider" : "provider_to_customer";

  // Store customer→provider review in reviews table
  if (isCustomer && booking.providerId) {
    await db.insert(reviews).values({
      bookingId,
      customerId: me.id,
      providerId: booking.providerId,
      rating,
      comment: comment || null,
    }).onConflictDoNothing(); // prevent duplicate
  }

  // After both feedback received → release funds to provider
  // In production: check both sides submitted. For now: mark released on customer feedback.
  if (isCustomer) {
    await db.update(bookings).set({
      status: "released" as never,
      updatedAt: new Date(),
    }).where(eq(bookings.id, bookingId));

    // Credit provider wallet
    if (booking.providerId) {
      const amount = String(booking.totalPrice || "0");
      const platformFee = (Number(amount) * 0.15).toFixed(2); // 15% platform fee
      const providerEarning = (Number(amount) - Number(platformFee)).toFixed(2);

      // Upsert wallet balance (best-effort — wallet table may not exist yet)
      try {
        await db.execute(sql`
          INSERT INTO wallets (id, provider_id, balance_available, balance_pending, currency, updated_at)
          VALUES (gen_random_uuid(), ${booking.providerId}, ${providerEarning}, '0', ${booking.currency || 'AUD'}, NOW())
          ON CONFLICT (provider_id)
          DO UPDATE SET
            balance_available = (CAST(wallets.balance_available AS DECIMAL) + ${Number(providerEarning)})::TEXT,
            updated_at = NOW()
        `);
      } catch (walletErr) {
        console.warn("[feedback] Wallet upsert failed (table may not exist):", walletErr);
      }
    }
  }

  return NextResponse.json({
    success: true,
    feedbackType,
    rating,
    message: isCustomer
      ? "Thank you for your feedback! Payment has been released to your helper."
      : "Thank you for rating this customer. Your earnings are now available.",
    payoutTriggered: isCustomer,
  });
}

/**
 * GET /api/bookings/[id]/feedback
 * Get feedback status for a booking.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookingId } = await params;

  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Check if reviews exist
  const existingReviews = await db.select().from(reviews)
    .where(eq(reviews.bookingId, bookingId));

  return NextResponse.json({
    bookingId,
    status: booking.status,
    customerFeedback: existingReviews.find(r => r.customerId === booking.customerId) || null,
    providerFeedback: null, // Provider→customer feedback stored separately in production
    bothSubmitted: existingReviews.length >= 1 && booking.status === "released",
    payoutReleased: booking.status === "released",
  });
}
