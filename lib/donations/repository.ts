import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campaigns,
  donations,
  donationPayments,
  type Campaign,
  type Donation,
} from "@/lib/db/schema/donations";

// --- Campaign --------------------------------------------------------------

/** Returns the single active campaign, or null if none seeded. */
export async function getActiveCampaign(): Promise<Campaign | null> {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.isActive, true))
    .limit(1);
  return row ?? null;
}

// --- Progress (with in-memory cache) --------------------------------------

export interface CampaignProgress {
  campaignId: string;
  raisedCents: number;
  goalCents: number;
  donorCount: number;
  /** When this snapshot was computed (epoch ms). */
  computedAt: number;
}

const PROGRESS_TTL_MS = 60 * 1000;
const progressCache = new Map<string, CampaignProgress>();

/**
 * Returns raised/donor/goal for a campaign. Cached for 60s in-process —
 * good enough for a public landing page that gets refreshed often. Webhook
 * writes don't bust the cache; the next request after TTL picks up the new
 * total.
 */
export async function getCampaignProgress(
  campaignId: string,
): Promise<CampaignProgress> {
  const cached = progressCache.get(campaignId);
  if (cached && Date.now() - cached.computedAt < PROGRESS_TTL_MS) {
    return cached;
  }

  const [row] = await db.execute<{
    raised: string | null;
    goal: string;
    donors: string;
  }>(sql`
    SELECT
      COALESCE(SUM(p.amount_cents - p.refunded_amount_cents), 0)::bigint AS raised,
      c.goal_amount AS goal,
      (
        SELECT COUNT(DISTINCT lower(trim(d.donor_email)))::bigint
          FROM donations d
         WHERE d.campaign_id = c.id
           AND EXISTS (
             SELECT 1 FROM donation_payments dp
              WHERE dp.donation_id = d.id
                AND dp.amount_cents > dp.refunded_amount_cents
           )
      )::bigint AS donors
    FROM campaigns c
    LEFT JOIN donation_payments p
      ON p.campaign_id = c.id
     AND p.status IN ('succeeded', 'partially_refunded')
    WHERE c.id = ${campaignId}
    GROUP BY c.id, c.goal_amount
  `);

  const goalCents = row
    ? Math.round(parseFloat(row.goal) * 100)
    : 0;
  const raisedCents = row ? Number(row.raised ?? 0) : 0;
  const donorCount = row ? Number(row.donors) : 0;

  const snapshot: CampaignProgress = {
    campaignId,
    raisedCents,
    goalCents,
    donorCount,
    computedAt: Date.now(),
  };
  progressCache.set(campaignId, snapshot);
  return snapshot;
}

// --- Donations ------------------------------------------------------------

export interface CreatePendingInput {
  campaignId: string;
  amountCents: number;
  currency: string;
  mode: "once" | "monthly";
  locale: string;
  donor: { name: string; email: string; phone?: string; message?: string };
  isAnonymous?: boolean;
}

export async function createPendingDonation(
  input: CreatePendingInput,
): Promise<Donation> {
  const [row] = await db
    .insert(donations)
    .values({
      campaignId: input.campaignId,
      amountCents: input.amountCents,
      currency: input.currency,
      mode: input.mode,
      status: "pending",
      donorName: input.donor.name,
      donorEmail: input.donor.email.trim().toLowerCase(),
      donorPhone: input.donor.phone || null,
      donorMessage: input.donor.message || null,
      isAnonymous: input.isAnonymous ?? false,
      locale: input.locale,
    })
    .returning();
  return row;
}

export async function attachSessionId(
  donationId: string,
  sessionId: string,
): Promise<void> {
  await db
    .update(donations)
    .set({ stripeSessionId: sessionId, updatedAt: new Date() })
    .where(eq(donations.id, donationId));
}

/** Find by stripeSessionId; returns null if no donation has been linked yet. */
export async function findDonationBySessionId(
  sessionId: string,
): Promise<Donation | null> {
  const [row] = await db
    .select()
    .from(donations)
    .where(eq(donations.stripeSessionId, sessionId))
    .limit(1);
  return row ?? null;
}

export async function findDonationBySubscriptionId(
  subscriptionId: string,
): Promise<Donation | null> {
  const [row] = await db
    .select()
    .from(donations)
    .where(eq(donations.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return row ?? null;
}

export async function findDonationById(
  donationId: string,
): Promise<Donation | null> {
  const [row] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, donationId))
    .limit(1);
  return row ?? null;
}

export async function markDonationCompleted(
  sessionId: string,
): Promise<void> {
  await db
    .update(donations)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(donations.stripeSessionId, sessionId));
}

export async function activateSubscription(
  sessionId: string,
  customerId: string,
  subscriptionId: string,
): Promise<void> {
  await db
    .update(donations)
    .set({
      status: "active",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(donations.stripeSessionId, sessionId));
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await db
    .update(donations)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(donations.stripeSubscriptionId, subscriptionId));
}

// --- Payments -------------------------------------------------------------

export interface RecordPaymentInput {
  donationId: string;
  campaignId: string;
  amountCents: number;
  currency: string;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  stripeChargeId: string | null;
  receiptUrl: string | null;
  billingReason: string | null;
  capturedAt: Date;
}

/**
 * Insert a donation_payment if not already present. Idempotency key is
 * stripeInvoiceId (monthly) or stripePaymentIntentId (single). Returns
 * `inserted: true` only if this call actually created the row — webhook
 * handlers use this signal to decide whether to send the thank-you email.
 */
export async function recordPayment(
  input: RecordPaymentInput,
): Promise<{ inserted: boolean }> {
  // Choose the dedup column that has a value. invoice takes precedence
  // (monthly always has it; single never does).
  if (!input.stripeInvoiceId && !input.stripePaymentIntentId) {
    throw new Error(
      "recordPayment needs at least one of stripeInvoiceId or stripePaymentIntentId",
    );
  }
  const conflictTarget = input.stripeInvoiceId
    ? donationPayments.stripeInvoiceId
    : donationPayments.stripePaymentIntentId;

  const inserted = await db
    .insert(donationPayments)
    .values({
      donationId: input.donationId,
      campaignId: input.campaignId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: "succeeded",
      stripePaymentIntentId: input.stripePaymentIntentId,
      stripeInvoiceId: input.stripeInvoiceId,
      stripeChargeId: input.stripeChargeId,
      receiptUrl: input.receiptUrl,
      billingReason: input.billingReason,
      capturedAt: input.capturedAt,
    })
    .onConflictDoNothing({ target: conflictTarget })
    .returning({ id: donationPayments.id });

  return { inserted: inserted.length > 0 };
}

/**
 * Refund event primary path. Idempotent against duplicate `refund.created`
 * delivery — refundId already in the array means no-op.
 */
export async function applyRefundCreated(input: {
  paymentIntentId?: string | null;
  chargeId?: string | null;
  refundId: string;
  refundAmountCents: number;
}): Promise<{ applied: boolean }> {
  if (!input.paymentIntentId && !input.chargeId) {
    return { applied: false };
  }
  const result = await db.execute(sql`
    UPDATE donation_payments
       SET stripe_refund_ids = array_append(stripe_refund_ids, ${input.refundId}),
           refunded_amount_cents = refunded_amount_cents + ${input.refundAmountCents},
           status = CASE
             WHEN refunded_amount_cents + ${input.refundAmountCents} >= amount_cents THEN 'refunded'::donation_payment_status
             ELSE 'partially_refunded'::donation_payment_status
           END,
           refunded_at = now()
     WHERE NOT (${input.refundId} = ANY(stripe_refund_ids))
       AND (
         ${input.paymentIntentId === undefined || input.paymentIntentId === null
           ? sql`FALSE`
           : sql`stripe_payment_intent_id = ${input.paymentIntentId}`}
         OR ${input.chargeId === undefined || input.chargeId === null
           ? sql`FALSE`
           : sql`stripe_charge_id = ${input.chargeId}`}
       )
     RETURNING id
  `);
  return { applied: (result as { length: number }).length > 0 };
}

/**
 * Refund event fallback. Syncs `donation_payments.refunded_amount_cents`
 * up to `charge.amount_refunded` if the primary refund.created event was
 * missed. Never touches stripe_refund_ids (no refund.id available here).
 */
export async function syncChargeRefunded(input: {
  paymentIntentId?: string | null;
  chargeId?: string | null;
  chargeAmountRefundedCents: number;
}): Promise<{ updated: boolean }> {
  if (!input.paymentIntentId && !input.chargeId) {
    return { updated: false };
  }
  const result = await db.execute(sql`
    UPDATE donation_payments
       SET refunded_amount_cents = ${input.chargeAmountRefundedCents},
           status = CASE
             WHEN ${input.chargeAmountRefundedCents} >= amount_cents THEN 'refunded'::donation_payment_status
             ELSE 'partially_refunded'::donation_payment_status
           END,
           refunded_at = COALESCE(refunded_at, now())
     WHERE refunded_amount_cents < ${input.chargeAmountRefundedCents}
       AND (
         ${input.paymentIntentId === undefined || input.paymentIntentId === null
           ? sql`FALSE`
           : sql`stripe_payment_intent_id = ${input.paymentIntentId}`}
         OR ${input.chargeId === undefined || input.chargeId === null
           ? sql`FALSE`
           : sql`stripe_charge_id = ${input.chargeId}`}
       )
     RETURNING id
  `);
  return { updated: (result as { length: number }).length > 0 };
}
