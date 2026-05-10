import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { providerProfiles } from "./providers";
import { paymentStatusEnum, payoutStatusEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    /** Nullable: row may exist before the Stripe PaymentIntent is created (e.g. status=pending). */
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    failedReason: text("failed_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bookingIdx: index("payments_booking_idx").on(t.bookingId),
    stripePiUq: uniqueIndex("payments_stripe_pi_uq").on(t.stripePaymentIntentId),
    statusIdx: index("payments_status_idx").on(t.status),
  }),
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    stripeRefundId: text("stripe_refund_id"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    reason: text("reason"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    paymentIdx: index("refunds_payment_idx").on(t.paymentId),
    stripeRefundUq: uniqueIndex("refunds_stripe_refund_uq").on(t.stripeRefundId),
  }),
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    stripeTransferId: text("stripe_transfer_id"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    status: payoutStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    providerIdx: index("payouts_provider_idx").on(t.providerId),
    stripeTransferUq: uniqueIndex("payouts_stripe_transfer_uq").on(
      t.stripeTransferId,
    ),
    statusIdx: index("payouts_status_idx").on(t.status),
  }),
);

/** Provider escrow wallet. 1:1 with provider_profiles. */
export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    balancePending: decimal("balance_pending", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    balanceAvailable: decimal("balance_available", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    currency: text("currency").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    providerUq: uniqueIndex("wallets_provider_uq").on(t.providerId),
  }),
);

export type Payment = typeof payments.$inferSelect;
export type Refund = typeof refunds.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
