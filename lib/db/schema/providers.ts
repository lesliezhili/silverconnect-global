import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import {
  onboardingStatusEnum,
  documentTypeEnum,
  documentStatusEnum,
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

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type NewProviderProfile = typeof providerProfiles.$inferInsert;
export type ProviderDocument = typeof providerDocuments.$inferSelect;
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type ProviderBlockedTime = typeof providerBlockedTimes.$inferSelect;
export type ProviderCategory = typeof providerCategories.$inferSelect;
export type ProviderBadge = typeof providerBadges.$inferSelect;
