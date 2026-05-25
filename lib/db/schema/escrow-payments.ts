import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";

// Enum for payment transaction types
const paymentTransactionTypeEnum = (name: string) =>
  name as any; // Will be defined in enums.ts

export const escrowAccounts = pgTable(
  "escrow_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    providerShare: decimal("provider_share", { precision: 10, scale: 2 }).notNull(),
    platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
    charityFund: decimal("charity_fund", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("held"), // held, released, refunded, disputed
    stripeTransferId: text("stripe_transfer_id"),
    heldAt: timestamp("held_at", { withTimezone: true }).defaultNow().notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bookingUq: uniqueIndex("escrow_accounts_booking_uq").on(t.bookingId),
    customerIdx: index("escrow_accounts_customer_idx").on(t.customerId),
    providerIdx: index("escrow_accounts_provider_idx").on(t.providerId),
    statusIdx: index("escrow_accounts_status_idx").on(t.status),
  }),
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    escrowAccountId: uuid("escrow_account_id")
      .notNull()
      .references(() => escrowAccounts.id, { onDelete: "cascade" }),
    transactionType: text("transaction_type").notNull(), // charge, hold, release, refund
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    stripeTransactionId: text("stripe_transaction_id"),
    status: text("status").notNull().default("pending"), // pending, completed, failed
    metadata: text("metadata"), // JSON string for additional context
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    escrowIdx: index("payment_transactions_escrow_idx").on(t.escrowAccountId),
    typeIdx: index("payment_transactions_type_idx").on(t.transactionType),
  }),
);

export const escrowDisputes = pgTable(
  "escrow_disputes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    initiatedBy: uuid("initiated_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    description: text("description"),
    status: text("status").notNull().default("open"), // open, evidence_needed, decided, closed
    resolution: text("resolution"), // refund_full, refund_partial, denied, withdrawn
    adminNote: text("admin_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bookingIdx: index("escrow_disputes_booking_idx").on(t.bookingId),
    statusIdx: index("escrow_disputes_status_idx").on(t.status),
  }),
);

export type EscrowAccount = typeof escrowAccounts.$inferSelect;
export type NewEscrowAccount = typeof escrowAccounts.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type EscrowDisputeRecord = typeof escrowDisputes.$inferSelect;
