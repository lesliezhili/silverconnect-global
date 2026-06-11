import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { roleEnum } from "./enums";

export const adminActions = pgTable(
  "admin_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Nullable so the action record outlives admin account deletion
     * (audit trail). Set when the action is recorded. */
    adminId: uuid("admin_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** e.g. 'provider.approve', 'dispute.refund', 'user.suspend'. */
    action: text("action").notNull(),
    /** e.g. 'provider' | 'booking' | 'user' | 'review' | 'dispute'. */
    targetType: text("target_type").notNull(),
    /** Stored as text so it works for non-uuid IDs too. */
    targetId: text("target_id").notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    adminCreatedIdx: index("admin_actions_admin_created_idx").on(
      t.adminId,
      t.createdAt,
    ),
    targetIdx: index("admin_actions_target_idx").on(t.targetType, t.targetId),
  }),
);

export const adminSettings = pgTable(
  "admin_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Dotted key — e.g. 'platform.fee_rate.AU', 'cancellation.window_hours'. */
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    keyUq: uniqueIndex("admin_settings_key_uq").on(t.key),
  }),
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Null for system-initiated actions (cron, webhook, etc.). */
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorRole: roleEnum("actor_role"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    actorCreatedIdx: index("audit_log_actor_created_idx").on(
      t.actorId,
      t.createdAt,
    ),
    actionIdx: index("audit_log_action_idx").on(t.action),
    targetIdx: index("audit_log_target_idx").on(t.targetType, t.targetId),
  }),
);

export type AdminAction = typeof adminActions.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
