import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * A processing row whose `lockedAt` is older than this is assumed to be from
 * a crashed worker and may be reclaimed. 5 minutes is comfortably longer
 * than any single Stripe event handler should ever take.
 */
export const STALE_LOCK_THRESHOLD_MS = 5 * 60 * 1000;
const STALE_LOCK_INTERVAL_SQL = "5 minutes";

export type ClaimResult =
  | "claimed" // OK to process now
  | "duplicate-succeeded" // already processed; return 200, no-op
  | "in-progress"; // another worker holds an unexpired lock; return 409

/**
 * Atomically claim a Stripe webhook event for processing. Implements the
 * claim-then-finalize pattern with stale-lock takeover:
 *
 *   - First delivery     → INSERT new row, status='processing'
 *   - After 'failed'     → UPDATE back to 'processing', bump attemptCount
 *   - Stale 'processing' → UPDATE (takeover from crashed worker)
 *   - Active 'processing' → no-op, signal 'in-progress'
 *   - Already 'succeeded' → no-op, signal 'duplicate-succeeded'
 *
 * Single round-trip: one INSERT...ON CONFLICT DO UPDATE WHERE..., then one
 * fallback SELECT only if no row was returned.
 */
export async function claimEvent(
  eventId: string,
  type: string,
): Promise<ClaimResult> {
  const upsert = await db.execute(sql`
    INSERT INTO processed_stripe_events (id, type, status, locked_at, attempt_count, received_at)
    VALUES (${eventId}, ${type}, 'processing', now(), 1, now())
    ON CONFLICT (id) DO UPDATE
      SET status = 'processing',
          locked_at = now(),
          attempt_count = processed_stripe_events.attempt_count + 1,
          last_error = NULL
      WHERE processed_stripe_events.status = 'failed'
         OR (processed_stripe_events.status = 'processing'
             AND processed_stripe_events.locked_at < now() - ${sql.raw(`INTERVAL '${STALE_LOCK_INTERVAL_SQL}'`)})
    RETURNING id
  `);

  if ((upsert as { length: number }).length > 0) return "claimed";

  // CONFLICT didn't match the WHERE — check why.
  const existing = await db.execute(sql`
    SELECT status FROM processed_stripe_events WHERE id = ${eventId}
  `);
  const row = (existing as unknown as Array<{ status: string }>)[0];
  if (!row) {
    // Should never happen — conflict means it exists. Treat as in-progress
    // to be safe (Stripe will retry).
    return "in-progress";
  }
  if (row.status === "succeeded") return "duplicate-succeeded";
  return "in-progress";
}

/** Mark the event as completed; clears lockedAt. */
export async function finalizeEventSucceeded(eventId: string): Promise<void> {
  await db.execute(sql`
    UPDATE processed_stripe_events
       SET status = 'succeeded',
           completed_at = now(),
           locked_at = NULL,
           last_error = NULL
     WHERE id = ${eventId}
  `);
}

/**
 * Mark the event as failed so a retry can reclaim it. Clears lockedAt
 * (the row is no longer being worked on) and stores the error message
 * for debugging.
 */
export async function finalizeEventFailed(
  eventId: string,
  error: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE processed_stripe_events
       SET status = 'failed',
           locked_at = NULL,
           last_error = ${error.slice(0, 2000)}
     WHERE id = ${eventId}
  `);
}
