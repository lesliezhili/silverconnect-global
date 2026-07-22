import {
  pgTable,
  uuid,
  text,
  decimal,
  timestamp,
  uniqueIndex,
  index,
  bigserial,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * One balance-cache row per user. The source of truth is
 * coinLedgerEntries — this is a denormalized running total, recomputed
 * transactionally alongside every ledger write.
 */
export const coinAccounts = pgTable(
  "coin_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userUq: uniqueIndex("coin_accounts_user_uq").on(t.userId),
  }),
);

/**
 * Triple-entry, hash-chained coin ledger. Every mint/redeem writes THREE
 * rows sharing one transactionId: a debit (system pool), a credit (user
 * account), and a receipt — a third, independently-verifiable record
 * whose hash covers the other two plus the previous receipt's hash,
 * forming a single global append-only chain (see lib/coins/ledger.ts).
 * This is a purely internal, non-financial ledger: no real cryptocurrency,
 * no wallets, nothing tradable or cashable — see hasGovtFundingAccess-
 * style scoping notes in lib/coins/ledger.ts for the reasoning.
 */
export const coinLedgerEntries = pgTable(
  "coin_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Monotonic write order — the chain links via this, not createdAt (which isn't safe under concurrent writes). */
    seq: bigserial("seq", { mode: "number" }).notNull(),
    transactionId: uuid("transaction_id").notNull(),
    entryRole: text("entry_role").notNull(), // debit | credit | receipt
    accountRef: text("account_ref").notNull(), // "system:<pool>" | "user:<userId>"
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    reason: text("reason").notNull(), // registration_bonus | booking_completed | redeem_<perkKey>
    prevHash: text("prev_hash"),
    hash: text("hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    txIdx: index("coin_ledger_entries_tx_idx").on(t.transactionId),
    userIdx: index("coin_ledger_entries_user_idx").on(t.userId),
    createdIdx: index("coin_ledger_entries_created_idx").on(t.createdAt),
  }),
);

/**
 * One row per one-time perk a user has unlocked by redeeming coins.
 * Perks are non-financial recognition (badges, wall-of-honor listing) —
 * never a cash-equivalent discount — see PERK_CATALOG in
 * lib/coins/ledger.ts.
 */
export const coinPerkUnlocks = pgTable(
  "coin_perk_unlocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    perkKey: text("perk_key").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userPerkUq: uniqueIndex("coin_perk_unlocks_user_perk_uq").on(t.userId, t.perkKey),
  }),
);

export type CoinAccount = typeof coinAccounts.$inferSelect;
export type CoinLedgerEntry = typeof coinLedgerEntries.$inferSelect;
export type CoinPerkUnlock = typeof coinPerkUnlocks.$inferSelect;
