import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// 和润心语者 Database Schema — aligned with Cell 23b Supabase migration

/** Registered 心语者 service providers */
export const xinyuzheProviders = pgTable('xinyuzhe_providers', {
  id:               text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  userId:           text('user_id'),                              // nullable — public registration, no account required
  fullName:         text('full_name').notNull(),
  phone:            text('phone').notNull(),
  email:            text('email').notNull(),
  city:             text('city'),
  education:        text('education'),
  major:            text('major'),
  university:       text('university'),
  licenseType:      text('license_type'),
  licenseNumber:    text('license_number'),
  yearsExperience:  integer('years_experience').default(0),
  serviceTypes:     text('service_types').array(),
  bio:              text('bio'),
  status:           text('status').default('pending'),             // pending|approved|suspended
  agreeTerms:       boolean('agree_terms').default(false),
  agreeBackground:  boolean('agree_background').default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

/** Training progress per provider per module */
export const xinyuzheTrainingProgress = pgTable('xinyuzhe_training_progress', {
  id:          text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  providerId:  text('provider_id').notNull(),
  moduleId:    text('module_id').notNull(),
  lessonId:    text('lesson_id').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
  score:       integer('score'),
})

/** Session logs */
export const xinyuzheSessions = pgTable('xinyuzhe_sessions', {
  id:              text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  providerId:      text('provider_id').notNull(),
  clientAlias:     text('client_alias').notNull(),
  serviceType:     text('service_type').notNull(),
  sessionDate:     timestamp('session_date', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes'),
  status:          text('status').default('scheduled'),
  sessionNotes:    text('session_notes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
})

/** Session feedback */
export const xinyuzheFeedback = pgTable('xinyuzhe_feedback', {
  id:                  text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  sessionId:           text('session_id'),
  providerId:          text('provider_id').notNull(),
  clientSatisfaction:  integer('client_satisfaction'),
  emotionalConnection: integer('emotional_connection'),
  professionalism:     integer('professionalism'),
  wouldRecommend:      boolean('would_recommend'),
  clientComment:       text('client_comment'),
  providerNotes:       text('provider_notes'),
  submittedAt:         timestamp('submitted_at', { withTimezone: true }).defaultNow(),
})
