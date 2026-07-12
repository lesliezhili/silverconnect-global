import {
  pgTable,
  uuid,
  text,
  decimal,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * One shareable code per user, created lazily on first visit to
 * /profile/referrals.
 */
export const referralCodes = pgTable(
  "referral_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userUq: uniqueIndex("referral_codes_user_uq").on(t.userId),
    codeUq: uniqueIndex("referral_codes_code_uq").on(t.code),
  }),
);

/**
 * One row per referred signup. `refereeUserId` is unique — a person can
 * only ever be referred once. Status flips pending -> rewarded when the
 * referee's first booking reaches `released` (see
 * app/api/bookings/[id]/feedback/route.ts).
 */
export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerUserId: uuid("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refereeUserId: uuid("referee_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referralCode: text("referral_code").notNull(),
    status: text("status").notNull().default("pending"), // pending | rewarded
    rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }),
    rewardCurrency: text("reward_currency"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
  },
  (t) => ({
    refereeUq: uniqueIndex("referrals_referee_uq").on(t.refereeUserId),
    referrerIdx: index("referrals_referrer_idx").on(t.referrerUserId),
    statusIdx: index("referrals_status_idx").on(t.status),
  }),
);

/**
 * Ledger of earned referral credits — one row per side (referrer,
 * referee) per rewarded referral. Tracked and displayed only in v1; not
 * yet consulted by the live payment flow (see plan notes).
 */
export const referralCredits = pgTable(
  "referral_credits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    reason: text("reason").notNull(), // referrer_bonus | referee_bonus
    referralId: uuid("referral_id")
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("referral_credits_user_idx").on(t.userId),
  }),
);

export type ReferralCode = typeof referralCodes.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type ReferralCredit = typeof referralCredits.$inferSelect;
