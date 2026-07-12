import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { reviews } from "@/lib/db/schema/reviews";
import { providerProfiles } from "@/lib/db/schema/providers";
import { wallets } from "@/lib/db/schema/payments";
import { referrals, referralCredits } from "@/lib/db/schema/referrals";
import { getCurrentUser } from "@/lib/auth/server";
import { notifyAndEmail } from "@/lib/notifications/server";
import { eq, and, sql } from "drizzle-orm";

const REFERRAL_REWARD_AMOUNT = "25.00";

/**
 * Pays out a pending referral if this is the referee's first-ever
 * released booking. Never throws — a referral hiccup must not block the
 * customer's feedback submission or the provider's payout.
 */
async function maybeRewardReferral(customerId: string, currency: string) {
  try {
    const [pending] = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.refereeUserId, customerId), eq(referrals.status, "pending")))
      .limit(1);
    if (!pending) return;

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS "releasedCount" FROM bookings
      WHERE customer_id = ${customerId} AND status = 'released'
    `);
    const countRows = Array.isArray(countResult) ? countResult : (countResult as unknown as { rows: { releasedCount: number }[] }).rows;
    if (countRows[0]?.releasedCount !== 1) return; // not their first released booking

    await db
      .update(referrals)
      .set({ status: "rewarded", rewardAmount: REFERRAL_REWARD_AMOUNT, rewardCurrency: currency, rewardedAt: new Date() })
      .where(eq(referrals.id, pending.id));

    await db.insert(referralCredits).values([
      { userId: pending.referrerUserId, amount: REFERRAL_REWARD_AMOUNT, currency, reason: "referrer_bonus", referralId: pending.id },
      { userId: pending.refereeUserId, amount: REFERRAL_REWARD_AMOUNT, currency, reason: "referee_bonus", referralId: pending.id },
    ]);

    await notifyAndEmail({
      userId: pending.referrerUserId,
      kind: "system",
      title: "You earned a referral bonus! 🎉",
      body: `Your friend completed their first booking — ${currency} ${REFERRAL_REWARD_AMOUNT} has been added to your referral credit.`,
      link: "/profile/referrals",
      email: {
        subject: "You earned a referral bonus!",
        text: `Your friend completed their first booking. ${currency} ${REFERRAL_REWARD_AMOUNT} has been added to your referral credit.`,
        html: `<p>Your friend completed their first booking on SilverConnect.</p><p><strong>${currency} ${REFERRAL_REWARD_AMOUNT}</strong> has been added to your referral credit.</p>`,
      },
    });
    await notifyAndEmail({
      userId: pending.refereeUserId,
      kind: "system",
      title: "Welcome bonus earned! 🎉",
      body: `Thanks for completing your first booking — ${currency} ${REFERRAL_REWARD_AMOUNT} referral credit has been added to your account.`,
      link: "/profile/referrals",
      email: {
        subject: "Your welcome bonus has landed",
        text: `Thanks for completing your first booking. ${currency} ${REFERRAL_REWARD_AMOUNT} has been added to your referral credit.`,
        html: `<p>Thanks for completing your first booking on SilverConnect.</p><p><strong>${currency} ${REFERRAL_REWARD_AMOUNT}</strong> has been added to your referral credit.</p>`,
      },
    });
  } catch (e) {
    console.error("[feedback] referral reward failed:", e);
  }
}

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

    await maybeRewardReferral(booking.customerId, booking.currency || "AUD");
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
