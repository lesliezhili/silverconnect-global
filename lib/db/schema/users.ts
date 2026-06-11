import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  roleEnum,
  countryEnum,
  localeEnum,
  verificationPurposeEnum,
} from "./enums";

/**
 * Users table — matches ACTUAL Neon DB columns (combined-schema.sql migration).
 * Do NOT add columns here without running drizzle-kit push first!
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    role: roleEnum("role").notNull().default("customer"),
    country: countryEnum("country").notNull().default("AU"),
    locale: localeEnum("locale").notNull().default("en"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    emailLowerUq: uniqueIndex("users_email_lower_uq").on(sql`lower(${t.email})`),
  }),
);

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    purpose: verificationPurposeEnum("purpose").notNull().default("email_verify"),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("verification_codes_email_idx").on(t.email),
    expiresIdx: index("verification_codes_expires_idx").on(t.expiresAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;

/** Representative/helper delegation — exists in DB (combined-schema.sql). */
export const userRepresentatives = pgTable(
  "user_representatives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    elderUserId: uuid("elder_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    representativeUserId: uuid("representative_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    authorizationDocUrl: text("authorization_doc_url"),
    verified: boolean("is_verified").notNull().default(false),
    linkedAt: timestamp("linked_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    elderIdx: index("idx_representatives_elder").on(t.elderUserId),
    repIdx: index("idx_representatives_rep").on(t.representativeUserId),
  }),
);
export type UserRepresentative = typeof userRepresentatives.$inferSelect;

/** Role switch audit log — exists in DB (combined-schema.sql). */
export const userRoleSwitches = pgTable(
  "user_role_switches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fromRole: text("from_role").notNull(),
    toRole: text("to_role").notNull(),
    switchedAt: timestamp("switched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userSwitchIdx: index("idx_role_switches_user").on(t.userId, t.switchedAt),
  }),
);
export type UserRoleSwitch = typeof userRoleSwitches.$inferSelect;
