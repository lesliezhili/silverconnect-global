import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import {
  localeEnum,
  aiMessageRoleEnum,
  safetySeverityEnum,
} from "./enums";

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Null for anonymous chat (pre-login Q&A). Cascades on account
     * deletion so chat history is purged with the user (privacy). */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull().default("en"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    /** Set when AI detects emergency keywords. */
    emergencyTriggeredAt: timestamp("emergency_triggered_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("ai_conversations_user_idx").on(t.userId),
  }),
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: aiMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    tokens: integer("tokens"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    conversationIdx: index("ai_messages_conversation_idx").on(t.conversationId),
  }),
);

export const aiKb = pgTable(
  "ai_kb",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** e.g. 'pricing' | 'policy' | 'how-to' | 'safety'. */
    category: text("category").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    locale: localeEnum("locale").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    categoryLocaleIdx: index("ai_kb_category_locale_idx").on(
      t.category,
      t.locale,
    ),
  }),
);

export const aiEmergencyKeywords = pgTable(
  "ai_emergency_keywords",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    keyword: text("keyword").notNull(),
    locale: localeEnum("locale").notNull(),
    severity: safetySeverityEnum("severity").notNull().default("high"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    keywordLocaleUq: uniqueIndex("ai_emergency_keywords_keyword_locale_uq").on(
      t.keyword,
      t.locale,
    ),
  }),
);

export type AiConversation = typeof aiConversations.$inferSelect;
export type AiMessage = typeof aiMessages.$inferSelect;
export type AiKb = typeof aiKb.$inferSelect;
export type AiEmergencyKeyword = typeof aiEmergencyKeywords.$inferSelect;
