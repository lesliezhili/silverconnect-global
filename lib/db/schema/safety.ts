import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";
import { safetySeverityEnum, safetyStatusEnum } from "./enums";

export const safetyEvents = pgTable(
  "safety_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    /** 'sos_button' | 'ai_emergency_detected' | 'manual_report'. */
    kind: text("kind").notNull(),
    severity: safetySeverityEnum("severity").notNull().default("medium"),
    status: safetyStatusEnum("status").notNull().default("open"),
    description: text("description"),
    locationLat: decimal("location_lat", { precision: 9, scale: 6 }),
    locationLng: decimal("location_lng", { precision: 9, scale: 6 }),
    triggeredAt: timestamp("triggered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: uuid("acknowledged_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("safety_events_user_idx").on(t.userId),
    statusIdx: index("safety_events_status_idx").on(t.status),
    severityIdx: index("safety_events_severity_idx").on(t.severity),
    triggeredIdx: index("safety_events_triggered_idx").on(t.triggeredAt),
  }),
);

export const incidentReports = pgTable(
  "incident_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    /** 'accident' | 'theft' | 'harassment' | 'damage' | 'other'. */
    category: text("category").notNull(),
    body: text("body").notNull(),
    /** Array of uploaded photo URLs. */
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("incident_reports_user_idx").on(t.userId),
    categoryIdx: index("incident_reports_category_idx").on(t.category),
  }),
);

export type SafetyEvent = typeof safetyEvents.$inferSelect;
export type IncidentReport = typeof incidentReports.$inferSelect;
