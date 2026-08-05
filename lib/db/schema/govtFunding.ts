import { pgTable, uuid, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Admin-managed allowlist for government-funded program features (NDIS, TAC,
 * WorkSafe, DVA, My Aged Care, Aged Pension/CHSP, Super) — replaces a
 * hardcoded email Set so the platform owner can grant access to vetted
 * providers/customers one at a time as SilverConnect's own NDIS registration
 * and cash flow allow, without a code deploy per grant. `ndisVerified` /
 * `ndisVerificationNote` record a MANUAL check against the NDIS Commission's
 * public provider register (no automated API exists for this) — see
 * lib/auth/govtFundingAccess.ts.
 */
export const govtFundingGrants = pgTable(
  "govt_funding_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    grantedBy: text("granted_by"),
    ndisVerified: boolean("ndis_verified").notNull().default(false),
    ndisVerifiedAt: timestamp("ndis_verified_at", { withTimezone: true }),
    ndisVerificationNote: text("ndis_verification_note"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailUq: uniqueIndex("govt_funding_grants_email_uq").on(t.email),
  }),
);

export type GovtFundingGrant = typeof govtFundingGrants.$inferSelect;
export type NewGovtFundingGrant = typeof govtFundingGrants.$inferInsert;
