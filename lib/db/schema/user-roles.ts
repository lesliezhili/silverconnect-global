import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { roleEnum } from "./enums";

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentActiveRole: roleEnum("current_active_role").notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userUq: uniqueIndex("user_roles_user_uq").on(t.userId),
    roleIdx: index("user_roles_current_active_idx").on(t.currentActiveRole),
  }),
);

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
