import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { providerProfiles } from "./providers";

export const abnVerifications = pgTable(
  "abn_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    abn: text("abn").notNull(),
    businessName: text("business_name"),
    status: text("status").notNull().default("pending"), // pending, verified, invalid, inactive
    abrResponseData: text("abr_response_data"), // JSON response from ABR API
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    providerUq: uniqueIndex("abn_verifications_provider_uq").on(t.providerId),
    abnUq: uniqueIndex("abn_verifications_abn_uq").on(t.abn),
    statusIdx: index("abn_verifications_status_idx").on(t.status),
  }),
);

export const backgroundChecks = pgTable(
  "background_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    checkReference: text("check_reference").notNull(), // Reference ID from 3rd party service
    status: text("status").notNull().default("pending"), // pending, in_progress, cleared, flagged, expired
    clearanceLevel: text("clearance_level"), // basic, standard, enhanced, null if flagged/pending
    externalProviderName: text("external_provider_name"), // Name of screening service
    resultSummary: text("result_summary"), // JSON summary of findings
    flaggedIssues: text("flagged_issues"), // JSON array of issues if flagged
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    providerIdx: index("background_checks_provider_idx").on(t.providerId),
    statusIdx: index("background_checks_status_idx").on(t.status),
    referenceIdx: index("background_checks_reference_idx").on(t.checkReference),
  }),
);

export const userHelpers = pgTable(
  "user_helpers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    elderId: uuid("elder_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    representativeId: uuid("representative_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type"), // family, friend, donor, etc
    authorizationProofUrl: text("authorization_proof_url"), // Document URL or S3 reference
    verified: boolean("verified").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    canBookOnBehalf: boolean("can_book_on_behalf").notNull().default(true),
    linkedAt: timestamp("linked_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    elderIdx: index("user_helpers_elder_idx").on(t.elderId),
    repIdx: index("user_helpers_representative_idx").on(t.representativeId),
    verifiedIdx: index("user_helpers_verified_idx").on(t.verified),
  }),
);

export type ABNVerification = typeof abnVerifications.$inferSelect;
export type BackgroundCheck = typeof backgroundChecks.$inferSelect;
export type UserHelper = typeof userHelpers.$inferSelect;
