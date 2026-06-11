import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";
import { disputeStatusEnum, disputeResolutionEnum } from "./enums";

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    /** Nullable so the dispute record outlives user-account deletion. */
    raisedBy: uuid("raised_by").references(() => users.id, {
      onDelete: "set null",
    }),
    status: disputeStatusEnum("status").notNull().default("open"),
    reason: text("reason").notNull(),
    resolution: disputeResolutionEnum("resolution"),
    /** For partial refunds; ignored for full/denied. */
    resolutionAmount: decimal("resolution_amount", { precision: 10, scale: 2 }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: uuid("decided_by").references(() => users.id, {
      onDelete: "set null",
    }),
    decisionNote: text("decision_note"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bookingIdx: index("disputes_booking_idx").on(t.bookingId),
    statusIdx: index("disputes_status_idx").on(t.status),
  }),
);

export const disputeMessages = pgTable(
  "dispute_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    disputeId: uuid("dispute_id")
      .notNull()
      .references(() => disputes.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    /** Internal admin notes hidden from customer/provider. */
    isAdminOnly: boolean("is_admin_only").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    disputeIdx: index("dispute_messages_dispute_idx").on(t.disputeId),
  }),
);

export const disputeEvidence = pgTable(
  "dispute_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    disputeId: uuid("dispute_id")
      .notNull()
      .references(() => disputes.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    /** 'image' | 'document' | 'note'. */
    kind: text("kind").notNull(),
    /** Null for note kind. */
    fileUrl: text("file_url"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    disputeIdx: index("dispute_evidence_dispute_idx").on(t.disputeId),
  }),
);

export type Dispute = typeof disputes.$inferSelect;
export type DisputeMessage = typeof disputeMessages.$inferSelect;
export type DisputeEvidence = typeof disputeEvidence.$inferSelect;
