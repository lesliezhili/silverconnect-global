import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { onboardingStatusEnum } from "./enums";

/**
 * Day care centres and other B2B applicants (aged/disability day
 * programs). Sibling to `providerProfiles`, which covers individual
 * home-based carers — kept as a separate table since organisations have
 * a materially different field set (ABN, capacity, operating hours)
 * rather than personal qualifications/documents.
 */
export const organizationProfiles = pgTable(
  "organization_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    abn: text("abn").notNull(),
    addressLine: text("address_line").notNull(),
    region: text("region").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email").notNull(),
    capacity: integer("capacity"),
    operatingHours: text("operating_hours"),
    description: text("description"),
    onboardingStatus: onboardingStatusEnum("onboarding_status").notNull().default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index("organization_profiles_owner_idx").on(t.ownerUserId),
    statusIdx: index("organization_profiles_status_idx").on(t.onboardingStatus),
  }),
);

export type OrganizationProfile = typeof organizationProfiles.$inferSelect;
export type NewOrganizationProfile = typeof organizationProfiles.$inferInsert;
