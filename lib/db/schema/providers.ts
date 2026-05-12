import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import {
  onboardingStatusEnum,
  documentTypeEnum,
  documentStatusEnum,
  backgroundCheckStatusEnum,
  serviceCategoryEnum,
  timeSlotEnum,
  badgeKindEnum,
} from "./enums";

export const providerProfiles = pgTable(
  "provider_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    addressLine: text("address_line"),
    serviceLat: decimal("service_lat", { precision: 9, scale: 6 }),
    serviceLng: decimal("service_lng", { precision: 9, scale: 6 }),
    serviceRadiusKm: integer("service_radius_km").notNull().default(10),
    onboardingStatus: onboardingStatusEnum("onboarding_status").notNull().default("pending"),
    stripeAccountId: text("stripe_account_id"),
    // Australian Business Number (AU providers only). Validated against the
    // ABR Lookup API; businessName is the entity name returned by ABR.
    abn: text("abn"),
    businessName: text("business_name"),
    abnActive: boolean("abn_active"),
    abnValidatedAt: timestamp("abn_validated_at", { withTimezone: true }),
    // Provider's consent to run a third-party background check (NCC).
    bgCheckConsentAt: timestamp("bg_check_consent_at", { withTimezone: true }),
    bgCheckConsentVersion: text("bg_check_consent_version"),
    bgCheckConsentIp: text("bg_check_consent_ip"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userUq: uniqueIndex("provider_profiles_user_uq").on(t.userId),
    statusIdx: index("provider_profiles_status_idx").on(t.onboardingStatus),
  }),
);

export const providerDocuments = pgTable(
  "provider_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    type: documentTypeEnum("type").notNull(),
    fileUrl: text("file_url").notNull(),
    documentNumber: text("document_number"),
    status: documentStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewerNote: text("reviewer_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    providerTypeUq: uniqueIndex("provider_documents_provider_type_uq").on(t.providerId, t.type),
    providerIdx: index("provider_documents_provider_idx").on(t.providerId),
  }),
);

export const providerAvailability = pgTable(
  "provider_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    slot: timeSlotEnum("slot").notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => ({
    providerDayslotUq: uniqueIndex("provider_availability_provider_day_slot_uq").on(
      t.providerId,
      t.dayOfWeek,
      t.slot,
    ),
  }),
);

export const providerBlockedTimes = pgTable(
  "provider_blocked_times",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    providerStartIdx: index("provider_blocked_times_provider_start_idx").on(
      t.providerId,
      t.startsAt,
    ),
  }),
);

export const providerCategories = pgTable(
  "provider_categories",
  {
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    category: serviceCategoryEnum("category").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.providerId, t.category] }),
    categoryIdx: index("provider_categories_category_idx").on(t.category),
  }),
);

export const providerBadges = pgTable(
  "provider_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    kind: badgeKindEnum("kind").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    note: text("note"),
  },
  (t) => ({
    providerKindUq: uniqueIndex("provider_badges_provider_kind_uq").on(t.providerId, t.kind),
  }),
);

/**
 * One row per background-check attempt for a provider. The current attempt
 * has isCurrent=true; superseded attempts (renewals / re-checks) are kept
 * for history. The partial unique index guarantees at most one current row.
 */
export const providerBackgroundChecks = pgTable(
  "provider_background_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providerProfiles.id, { onDelete: "cascade" }),
    vendor: text("vendor").notNull(),
    externalRef: text("external_ref"),
    status: backgroundCheckStatusEnum("status").notNull().default("not_started"),
    requestedAt: timestamp("requested_at", { withTimezone: true }),
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rawPayload: jsonb("raw_payload"),
    lastError: text("last_error"),
    isCurrent: boolean("is_current").notNull().default(true),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    currentUq: uniqueIndex("provider_background_checks_current_uq")
      .on(t.providerId)
      .where(sql`${t.isCurrent}`),
    vendorRefUq: uniqueIndex("provider_background_checks_vendor_ref_uq")
      .on(t.vendor, t.externalRef)
      .where(sql`${t.externalRef} is not null`),
    providerIdx: index("provider_background_checks_provider_idx").on(t.providerId),
  }),
);

/**
 * Dedup ledger for the 30-day compliance-expiry alert cron. One row per
 * (subject, expiresAt) once we've sent the warning; if expiresAt changes
 * (renewal) a new alert fires for the new date.
 */
export const complianceExpiryAlerts = pgTable(
  "compliance_expiry_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // 'provider_document' | 'background_check'
    subjectType: text("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    alertedAt: timestamp("alerted_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    subjectExpiryUq: uniqueIndex("compliance_expiry_alerts_subject_expiry_uq").on(
      t.subjectType,
      t.subjectId,
      t.expiresAt,
    ),
  }),
);

/**
 * Inbox for background-check vendor webhooks — including orphan callbacks
 * (no matching local check row) and failed ones, so admins can inspect /
 * replay instead of losing them to a log line.
 */
export const complianceWebhookEvents = pgTable(
  "compliance_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendor: text("vendor").notNull(),
    vendorEventId: text("vendor_event_id"),
    externalRef: text("external_ref"),
    payload: jsonb("payload"),
    // 'received' | 'processed' | 'orphaned' | 'failed'
    status: text("status").notNull().default("received"),
    error: text("error"),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => ({
    vendorEventUq: uniqueIndex("compliance_webhook_events_vendor_event_uq")
      .on(t.vendor, t.vendorEventId)
      .where(sql`${t.vendorEventId} is not null`),
    statusIdx: index("compliance_webhook_events_status_idx").on(t.status),
  }),
);

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type NewProviderProfile = typeof providerProfiles.$inferInsert;
export type ProviderDocument = typeof providerDocuments.$inferSelect;
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type ProviderBlockedTime = typeof providerBlockedTimes.$inferSelect;
export type ProviderCategory = typeof providerCategories.$inferSelect;
export type ProviderBadge = typeof providerBadges.$inferSelect;
export type ProviderBackgroundCheck = typeof providerBackgroundChecks.$inferSelect;
export type NewProviderBackgroundCheck = typeof providerBackgroundChecks.$inferInsert;
export type ComplianceExpiryAlert = typeof complianceExpiryAlerts.$inferSelect;
export type ComplianceWebhookEvent = typeof complianceWebhookEvents.$inferSelect;
