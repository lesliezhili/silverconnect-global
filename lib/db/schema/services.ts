import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { countryEnum } from "./enums";

/**
 * Top-level service categories. The `code` column matches the values in
 * the `service_category` Postgres enum used by `provider_categories`.
 * Storing the metadata (icon, sort) here keeps the enum lean.
 */
export const serviceCategories = pgTable(
  "service_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    iconKey: text("icon_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeUq: uniqueIndex("service_categories_code_uq").on(t.code),
  }),
);

/**
 * Concrete service variants (e.g., "2h basic clean", "3h deep clean").
 * Belongs to a category by matching `categoryCode` against
 * `service_categories.code`.
 */
export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryCode: text("category_code").notNull(),
    code: text("code").notNull(),
    durationMin: integer("duration_min").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeUq: uniqueIndex("services_code_uq").on(t.code),
    categoryIdx: index("services_category_idx").on(t.categoryCode),
  }),
);

/**
 * Country-specific pricing. (service, country) is unique. Tax rate is a
 * decimal fraction (0.10 = 10%). Currency is ISO 4217 (AUD/CNY/CAD).
 */
export const servicePrices = pgTable(
  "service_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    country: countryEnum("country").notNull(),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull(),
    currency: text("currency").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    serviceCountryUq: uniqueIndex("service_prices_service_country_uq").on(
      t.serviceId,
      t.country,
    ),
  }),
);

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ServicePrice = typeof servicePrices.$inferSelect;
