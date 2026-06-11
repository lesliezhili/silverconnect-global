"use server";

import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import crypto from "node:crypto";

// ─── Module 5: PHledger Block Hashing ─────────────────────────────
function computeBlockHash(data: Record<string, unknown>, previousHash: string): string {
  const payload = JSON.stringify({ ...data, previousHash });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function getLastBlockHash(): Promise<string> {
  const result: any = await db.execute(sql`
    SELECT block_hash FROM phledger_blocks ORDER BY block_number DESC LIMIT 1
  `);
  const rows = result.rows as any[];
  return rows.length > 0 ? rows[0].block_hash : "GENESIS";
}

async function appendPHledgerBlock(data: {
  transactionType: string;
  bookingId: string | null;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const previousHash = await getLastBlockHash();
  const blockHash = computeBlockHash(
    { ...data, timestamp: new Date().toISOString() },
    previousHash,
  );

  await db.execute(sql`
    INSERT INTO phledger_blocks (transaction_type, booking_id, amount, currency, metadata, previous_block_hash, block_hash)
    VALUES (
      ${data.transactionType},
      ${data.bookingId},
      ${data.amount},
      ${data.currency},
      ${JSON.stringify(data.metadata ?? {})}::jsonb,
      ${previousHash},
      ${blockHash}
    )
  `);
}

// ─── Module 5: ProcessBookingPayment ──────────────────────────────
export interface PaymentResult {
  success: boolean;
  error?: string;
  escrowId?: string;
}

export async function processBookingPayment(bookingId: string): Promise<PaymentResult> {
  // Get booking details
  const [booking] = await db
    .select({
      id: bookings.id,
      customerId: bookings.customerId,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return { success: false, error: "Booking not found." };
  }

  if (booking.status !== "pending") {
    return { success: false, error: "Booking is not in payable state." };
  }

  const amount = Number(booking.totalPrice);

  // TODO: Integrate real Stripe payment processing
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100),
  //   currency: 'aud',
  //   customer: stripeCustomerId,
  // });
  const paymentSuccess = true; // Stub — replace with Stripe
  const stripePaymentIntentId = `pi_stub_${Date.now()}`;

  if (!paymentSuccess) {
    await db
      .update(bookings)
      .set({ status: "cancelled", cancelReason: "payment_failed", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
    return { success: false, error: "Financial processing rejected. Please verify transaction methods." };
  }

  // Hold funds in escrow
  const escrowResult: any = await db.execute(sql`
    INSERT INTO escrow_accounts (booking_id, amount, currency, status, held_at, stripe_payment_intent_id)
    VALUES (${bookingId}, ${amount}, 'AUD', 'held', NOW(), ${stripePaymentIntentId})
    RETURNING id
  `);
  const escrowId = (escrowResult.rows as any[])[0]?.id;

  // Update booking status
  await db
    .update(bookings)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Append immutable PHledger block
  await appendPHledgerBlock({
    transactionType: "ESCROW_LOCK",
    bookingId,
    amount,
    currency: "AUD",
    metadata: { stripePaymentIntentId },
  });

  return { success: true, escrowId };
}

// ─── Module 5: ReleaseEscrowOnCompletion ──────────────────────────
export async function releaseEscrowOnCompletion(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // Verify booking is completed
  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      totalPrice: bookings.totalPrice,
      providerId: bookings.providerId,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.status !== "completed") {
    return { success: false, error: "Booking must be in completed state to release escrow." };
  }

  const totalAmount = Number(booking.totalPrice);
  const platformFee = Math.round(totalAmount * 0.15 * 100) / 100;
  const providerPayout = Math.round((totalAmount - platformFee) * 100) / 100;
  // Charity surplus comes from the platform fee
  const charitySurplus = Math.round(platformFee * 0.3 * 100) / 100; // 30% of fee to charity

  // TODO: Real Stripe transfer to provider
  // await stripe.transfers.create({ amount: providerPayout * 100, destination: providerStripeAccountId });

  // Update escrow record
  await db.execute(sql`
    UPDATE escrow_accounts SET
      status = 'released',
      released_at = NOW(),
      provider_payout = ${providerPayout},
      platform_fee = ${platformFee},
      charity_surplus = ${charitySurplus}
    WHERE booking_id = ${bookingId}
  `);

  // Update booking final status
  await db
    .update(bookings)
    .set({ status: "released", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Append PHledger block for release
  await appendPHledgerBlock({
    transactionType: "ESCROW_RELEASE",
    bookingId,
    amount: totalAmount,
    currency: "AUD",
    metadata: {
      providerPayout,
      platformFee,
      charitySurplus,
      providerId: booking.providerId,
    },
  });

  return { success: true };
}

// ─── Module 5: Get Ledger History ─────────────────────────────────
export async function getLedgerHistory(bookingId?: string) {
  if (bookingId) {
    return db.execute(sql`
      SELECT * FROM phledger_blocks WHERE booking_id = ${bookingId} ORDER BY block_number ASC
    `);
  }
  return db.execute(sql`
    SELECT * FROM phledger_blocks ORDER BY block_number DESC LIMIT 100
  `);
}
