import {
  pgTable,
  uuid,
  text,
  decimal,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * General platform donations — not tied to any booking or person.
 * `donorUserId` is nullable: donating doesn't require an account.
 */
export const donations = pgTable(
  "donations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    donorUserId: uuid("donor_user_id").references(() => users.id, { onDelete: "set null" }),
    donorName: text("donor_name"),
    donorEmail: text("donor_email"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    message: text("message"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    status: text("status").notNull().default("pending"), // pending | succeeded | failed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    succeededAt: timestamp("succeeded_at", { withTimezone: true }),
  },
  (t) => ({
    piUq: uniqueIndex("donations_pi_uq").on(t.stripePaymentIntentId),
    statusIdx: index("donations_status_idx").on(t.status),
    donorIdx: index("donations_donor_idx").on(t.donorUserId),
  }),
);

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
