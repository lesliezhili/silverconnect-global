import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const aiSessions = pgTable(
  "ai_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionType: text("session_type").notNull(), // inquiry, biography, check_in
    intent: text("intent"), // emergency_safety, complaint, routine_inquiry, etc
    userMessage: text("user_message").notNull(),
    aiResponse: text("ai_response"),
    routedToHuman: boolean("routed_to_human").default(false),
    tokensUsed: integer("tokens_used").default(0),
    responseTime: integer("response_time"), // milliseconds
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("ai_sessions_customer_idx").on(t.customerId),
    typeIdx: index("ai_sessions_type_idx").on(t.sessionType),
    routedIdx: index("ai_sessions_routed_idx").on(t.routedToHuman),
  }),
);

export const biographyChapters = pgTable(
  "biography_chapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chapterNumber: integer("chapter_number").notNull(),
    audioTranscript: text("audio_transcript"),
    narrativeContent: text("narrative_content"),
    tokensConsumed: integer("tokens_consumed").notNull().default(0),
    status: text("status").notNull().default("draft"), // draft, published, archived
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    customerIdx: index("biography_chapters_customer_idx").on(t.customerId),
    chapterIdx: index("biography_chapters_number_idx").on(t.chapterNumber),
  }),
);

export const tokenQuotas = pgTable(
  "token_quotas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    maxAllowedQuota: integer("max_allowed_quota").notNull().default(100000), // tokens
    tokensConsumed: integer("tokens_consumed").notNull().default(0),
    quotaPeriodStart: timestamp("quota_period_start", { withTimezone: true }).defaultNow().notNull(),
    quotaPeriodEnd: timestamp("quota_period_end", { withTimezone: true }).notNull(),
    quotaExceeded: boolean("quota_exceeded").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    customerUq: uniqueIndex("token_quotas_customer_uq").on(t.customerId),
    exceededIdx: index("token_quotas_exceeded_idx").on(t.quotaExceeded),
  }),
);

export type AISession = typeof aiSessions.$inferSelect;
export type NewAISession = typeof aiSessions.$inferInsert;
export type BiographyChapter = typeof biographyChapters.$inferSelect;
export type TokenQuota = typeof tokenQuotas.$inferSelect;
