import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";
import { disputes } from "./disputes";
import { notificationKindEnum, notificationChannelEnum } from "./enums";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: notificationKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    /** Deep link inside the app — e.g. /bookings/abc-123. */
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    relatedBookingId: uuid("related_booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    relatedDisputeId: uuid("related_dispute_id").references(() => disputes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index("notifications_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.readAt),
  }),
);

export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    kind: notificationKindEnum("kind").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userChannelKindUq: uniqueIndex("notification_prefs_user_channel_kind_uq").on(
      t.userId,
      t.channel,
      t.kind,
    ),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NotificationPref = typeof notificationPrefs.$inferSelect;
