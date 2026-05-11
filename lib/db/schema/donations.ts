import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  donationModeEnum,
  donationStatusEnum,
  donationPaymentStatusEnum,
  processedStripeEventStatusEnum,
} from "./enums";

/** A fundraising campaign. MVP only ever has one row with isActive=true. */
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    /** Display goal in major units (AUD). UI never sums against this — it's a banner. */
    goalAmount: decimal("goal_amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugUq: uniqueIndex("campaigns_slug_uq").on(t.slug),
  }),
);

/**
 * One row per donor commitment.
 *   - mode='once'    : single donation, lifecycle pending → completed | failed
 *   - mode='monthly' : subscription record, lifecycle pending → active → cancelled
 *
 * Money that actually moved lives in `donation_payments`; this row's amountCents
 * is the *initial promise* and never sums into progress.
 */
export const donations = pgTable(
  "donations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "restrict" }),
    /** Stripe minor unit (cents). All money columns are cents to match Stripe API. */
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    mode: donationModeEnum("mode").notNull(),
    status: donationStatusEnum("status").notNull().default("pending"),
    /** Set immediately after Checkout Session creation; allows webhook lookup. */
    stripeSessionId: text("stripe_session_id"),
    /** Subscription mode only — Customer is auto-promoted from customer_email. */
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    donorName: text("donor_name").notNull(),
    /** Always lower(trim(...)) before insert. */
    donorEmail: text("donor_email").notNull(),
    donorPhone: text("donor_phone"),
    donorMessage: text("donor_message"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    /** UI locale at submission. Used to localize thank-you emails on every cycle. */
    locale: text("locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    sessionUq: uniqueIndex("donations_stripe_session_uq").on(t.stripeSessionId),
    subscriptionUq: uniqueIndex("donations_stripe_subscription_uq").on(
      t.stripeSubscriptionId,
    ),
    campaignIdx: index("donations_campaign_idx").on(t.campaignId),
    statusIdx: index("donations_status_idx").on(t.status),
    emailIdx: index("donations_donor_email_idx").on(t.donorEmail),
  }),
);

/**
 * One row per real charge (single payment = 1 row; monthly subscription = 1 row per cycle).
 * Sole source of truth for campaign progress.
 *
 * Refund accounting: amountCents is the original capture and never changes.
 * refundedAmountCents accumulates; status flips to partially_refunded /
 * refunded; net contribution = amountCents - refundedAmountCents.
 */
export const donationPayments = pgTable(
  "donation_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    /** Denormalized so progress queries don't need to join donations. */
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "restrict" }),
    amountCents: integer("amount_cents").notNull(),
    refundedAmountCents: integer("refunded_amount_cents").notNull().default(0),
    currency: text("currency").notNull(),
    status: donationPaymentStatusEnum("status").notNull().default("succeeded"),
    /** Single payment: from session.payment_intent. Monthly: from invoice.payment_intent. */
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** Monthly only — invoice.id, used as the dedup key for cycle payments. */
    stripeInvoiceId: text("stripe_invoice_id"),
    stripeChargeId: text("stripe_charge_id"),
    /**
     * Refund IDs accumulated from refund.created events. Used as idempotency
     * key against duplicate refund.created delivery. charge.refunded does NOT
     * touch this column (that event has no refund.id).
     */
    stripeRefundIds: text("stripe_refund_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** charge.receipt_url — Stripe-hosted receipt. */
    receiptUrl: text("receipt_url"),
    /** 'manual' (single) | 'subscription_create' | 'subscription_cycle' | 'subscription_update' | etc. */
    billingReason: text("billing_reason"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    piUq: uniqueIndex("donation_payments_pi_uq").on(t.stripePaymentIntentId),
    invoiceUq: uniqueIndex("donation_payments_invoice_uq").on(t.stripeInvoiceId),
    donationIdx: index("donation_payments_donation_idx").on(t.donationId),
    chargeIdx: index("donation_payments_charge_idx").on(t.stripeChargeId),
    /** Hot path: SUM(amountCents - refundedAmountCents) for one campaign. */
    campaignStatusIdx: index("donation_payments_campaign_status_idx").on(
      t.campaignId,
      t.status,
    ),
  }),
);

/**
 * Webhook idempotency + stale-lock takeover.
 *
 * Lifecycle: claim writes status='processing' + lockedAt=now. On success,
 * finalize sets status='succeeded' + lockedAt=null. On failure, status='failed'
 * is allowed to be reclaimed. A row stuck in 'processing' for longer than
 * STALE_LOCK_THRESHOLD (5 minutes, defined in lib/donations/events.ts) is
 * assumed to be from a crashed worker and may be reclaimed.
 */
export const processedStripeEvents = pgTable("processed_stripe_events", {
  /** Stripe event.id, e.g. evt_1Abc... */
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: processedStripeEventStatusEnum("status").notNull(),
  attemptCount: integer("attempt_count").notNull().default(1),
  lastError: text("last_error"),
  /** Set when status='processing'; cleared on finalize. NULL means not currently locked. */
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Campaign = typeof campaigns.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type DonationPayment = typeof donationPayments.$inferSelect;
export type ProcessedStripeEvent = typeof processedStripeEvents.$inferSelect;
