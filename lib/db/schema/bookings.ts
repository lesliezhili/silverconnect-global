import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  date,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { addresses } from "./customer-data";
import { providerProfiles } from "./providers";
import { services } from "./services";
import {
  bookingStatusEnum,
  bookingChangeTypeEnum,
  recurrenceFreqEnum,
} from "./enums";

export const recurringSeries = pgTable(
  "recurring_series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    addressId: uuid("address_id").references(() => addresses.id, {
      onDelete: "set null",
    }),
    frequency: recurrenceFreqEnum("frequency").notNull(),
    startDate: date("start_date").notNull(),
    /** Null = ongoing. Set to a past timestamp to end / cancel the series. */
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /** ISO weekday Mon=1..Sun=7. */
    weekday: integer("weekday").notNull(),
    hour: integer("hour").notNull(),
    minute: integer("minute").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("recurring_series_customer_idx").on(t.customerId),
  }),
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null until provider matched. Set null if provider account deleted. */
    providerId: uuid("provider_id").references(() => providerProfiles.id, {
      onDelete: "set null",
    }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    addressId: uuid("address_id").references(() => addresses.id, {
      onDelete: "set null",
    }),
    recurringSeriesId: uuid("recurring_series_id").references(
      () => recurringSeries.id,
      { onDelete: "set null" },
    ),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    /** Snapshot of price at booking time (price model can drift later). */
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("bookings_customer_idx").on(t.customerId),
    providerIdx: index("bookings_provider_idx").on(t.providerId),
    statusIdx: index("bookings_status_idx").on(t.status),
    scheduledIdx: index("bookings_scheduled_idx").on(t.scheduledAt),
  }),
);

export const bookingChanges = pgTable(
  "booking_changes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    type: bookingChangeTypeEnum("type").notNull(),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status"),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bookingIdx: index("booking_changes_booking_idx").on(t.bookingId),
  }),
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingChange = typeof bookingChanges.$inferSelect;
export type RecurringSeries = typeof recurringSeries.$inferSelect;
