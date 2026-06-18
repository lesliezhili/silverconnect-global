import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ── 和润心语者 Database Schema ────────────────────────────────────────────────

/** Registered 和润心语者 service providers (university students + trained volunteers) */
export const xinyuzheProviders = pgTable('xinyuzhe_providers', {
  id:                     text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  userId:                 text('user_id').notNull(),
  fullName:               text('full_name').notNull(),
  phone:                  text('phone').notNull(),
  email:                  text('email').notNull(),
  university:             text('university').notNull(),
  department:             text('department').notNull(),
  yearOfStudy:            integer('year_of_study'),
  specializations:        text('specializations').array(), // ['aiCompanionship','digitalBiography',...]
  status:                 text('status').default('pending'), // pending|active|suspended|graduated
  backgroundCheckConsent: boolean('background_check_consent').default(false),
  notes:                  text('notes'),
  createdAt:              timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

/** Training progress per provider per module unit (m1..m5, unitIndex 0-based) */
export const xinyuzheTrainingProgress = pgTable('xinyuzhe_training_progress', {
  id:          text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  providerId:  text('provider_id').notNull(),
  moduleId:    text('module_id').notNull(),
  unitIndex:   integer('unit_index').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  score:       integer('score'), // 0–100 for assessed units
})

/** Service sessions delivered by 和润心语者 providers */
export const xinyuzheSessions = pgTable('xinyuzhe_sessions', {
  id:              text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  providerId:      text('provider_id').notNull(),
  clientName:      text('client_name').notNull(),
  serviceType:     text('service_type').notNull(), // aiCompanionship|digitalBiography|...
  sessionDate:     timestamp('session_date', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes'),
  status:          text('status').default('scheduled'), // scheduled|completed|cancelled
  notes:           text('notes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
})

/** Session-level feedback (from client + provider self-assessment) */
export const xinyuzheFeedback = pgTable('xinyuzhe_feedback', {
  id:                  text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  sessionId:           text('session_id'),
  providerId:          text('provider_id').notNull(),
  clientSatisfaction:  integer('client_satisfaction'),   // 1–5
  emotionalConnection: integer('emotional_connection'),  // 1–5
  professionalism:     integer('professionalism'),       // 1–5
  wouldRecommend:      boolean('would_recommend'),
  clientComment:       text('client_comment'),
  providerNotes:       text('provider_notes'),
  submittedAt:         timestamp('submitted_at', { withTimezone: true }).defaultNow(),
})
