import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const bookingRequests = pgTable('booking_requests', {
  id:            uuid('id').defaultRandom().primaryKey(),
  ref:           text('ref').notNull().unique(),
  service:       text('service').notNull(),
  name:          text('name').notNull(),
  email:         text('email').notNull(),
  phone:         text('phone'),
  preferredDate: text('preferred_date'),
  message:       text('message'),
  status:        text('status').notNull().default('pending'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type BookingRequest    = typeof bookingRequests.$inferSelect
export type NewBookingRequest = typeof bookingRequests.$inferInsert
