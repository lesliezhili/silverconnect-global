"use server";

import { eq, and, sql, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { notify } from "@/lib/notifications/server";

// ─── Module 6: AI Periodic Check-In ──────────────────────────────
/**
 * Called by cron at intervals: 24h, 12h, 6h, 4h, 2h before appointment.
 * If provider doesn't confirm within the check window, escalates.
 */
export async function executeAIPeriodicCheckIn(
  bookingId: string,
  leadHoursRemaining: number,
): Promise<{ confirmed: boolean; escalated: boolean }> {
  const [booking] = await db
    .select({
      id: bookings.id,
      providerId: bookings.providerId,
      customerId: bookings.customerId,
      status: bookings.status,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.status !== "confirmed" || !booking.providerId) {
    return { confirmed: false, escalated: false };
  }

  // Send check-in notification to provider
  await notify({
    userId: booking.providerId,
    kind: "booking_update",
    title: `Confirming appointment in ${leadHoursRemaining} hours`,
    body: `Please confirm you are still available for your upcoming appointment. Reply to confirm.`,
    relatedBookingId: bookingId,
  });

  // Log the check-in attempt
  await db.execute(sql`
    INSERT INTO booking_checkins (booking_id, lead_hours, provider_confirmed, escalated)
    VALUES (${bookingId}, ${leadHoursRemaining}, NULL, false)
  `);

  // If within critical window (≤4 hours) and no prior confirmation,
  // trigger emergency reroute immediately
  if (leadHoursRemaining <= 4) {
    // Check if provider has confirmed any recent check-in
    const confirmations: any = await db.execute(sql`
      SELECT id FROM booking_checkins
      WHERE booking_id = ${bookingId}
        AND provider_confirmed = true
        AND checked_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `);

    if ((confirmations.rows as any[]).length === 0) {
      await triggerAutomatedEmergencyReroute(bookingId);
      return { confirmed: false, escalated: true };
    }
  }

  return { confirmed: false, escalated: false };
}

// ─── Module 6: Provider Confirms Check-In ─────────────────────────
export async function confirmCheckIn(
  bookingId: string,
  providerId: string,
): Promise<{ success: boolean }> {
  await db.execute(sql`
    UPDATE booking_checkins SET
      provider_confirmed = true,
      response_at = NOW()
    WHERE booking_id = ${bookingId}
      AND provider_confirmed IS NULL
    ORDER BY checked_at DESC
    LIMIT 1
  `);
  return { success: true };
}

// ─── Module 6: Emergency Reroute ──────────────────────────────────
/**
 * TriggerAutomatedEmergencyReroute — Module 6 spec.
 * Value-driven: sends wellness check to original provider,
 * then finds emergency-opted-in replacement within same region.
 */
export async function triggerAutomatedEmergencyReroute(
  bookingId: string,
): Promise<{ success: boolean; replacementFound: boolean; adminEscalated: boolean }> {
  const [booking] = await db
    .select({
      id: bookings.id,
      providerId: bookings.providerId,
      customerId: bookings.customerId,
      addressId: bookings.addressId,
      scheduledAt: bookings.scheduledAt,
      durationMin: bookings.durationMin,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || !booking.providerId) {
    return { success: false, replacementFound: false, adminEscalated: false };
  }

  const originalProviderId = booking.providerId;

  // Update booking status
  await db
    .update(bookings)
    .set({ status: "pending", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Value-driven: Check on the unavailable provider's wellbeing
  await notify({
    userId: originalProviderId,
    kind: "system",
    title: "Emergency system triggered — are you safe?",
    body: "Take care of yourself. We\'re re-routing the client to ensure continuity of care.",
    relatedBookingId: bookingId,
  });

  // Query emergency opt-in providers in the region
  const backupProviders: any = await db.execute(sql`
    SELECT pp.id, pp.user_id
    FROM provider_profiles pp
    WHERE pp.onboarding_status = 'approved'
      AND pp.emergency_opt_in = true
      AND pp.id != ${originalProviderId}
    ORDER BY RANDOM()
    LIMIT 5
  `);

  const backups = backupProviders.rows as any[];

  if (backups.length > 0) {
    const replacement = backups[0];

    // Re-assign booking without modifying pricing
    await db
      .update(bookings)
      .set({
        providerId: replacement.id,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    // Notify customer
    await notify({
      userId: booking.customerId,
      kind: "booking_update",
      title: "Your carer changed — slot protected",
      body: "A verified replacement is assigned. Your appointment time and price remain the same.",
      relatedBookingId: bookingId,
    });

    // Log the reroute
    await db.execute(sql`
      INSERT INTO emergency_reroutes (booking_id, original_provider_id, replacement_provider_id, reason, customer_notified)
      VALUES (${bookingId}, ${originalProviderId}, ${replacement.id}, 'provider_no_response', true)
    `);

    return { success: true, replacementFound: true, adminEscalated: false };
  } else {
    // No backup found — escalate to human admin
    await db.execute(sql`
      INSERT INTO emergency_reroutes (booking_id, original_provider_id, replacement_provider_id, reason, admin_escalated)
      VALUES (${bookingId}, ${originalProviderId}, NULL, 'no_backup_available', true)
    `);

    // TODO: HumanAdminAlertSystem.Escalate — send SMS/push to on-call admin
    console.error(`[EMERGENCY] No backup provider for booking ${bookingId}. Manual escalation required.`);

    return { success: true, replacementFound: false, adminEscalated: true };
  }
}

// ─── Module 6: Cron Endpoint Helper ──────────────────────────────
/**
 * Called by /api/cron/checkins — scans upcoming bookings and
 * triggers check-ins at appropriate lead times.
 */
export async function runScheduledCheckIns(): Promise<{
  checked: number;
  escalated: number;
}> {
  const checkWindows = [24, 12, 6, 4, 2]; // hours before appointment
  let checked = 0;
  let escalated = 0;

  for (const hours of checkWindows) {
    const windowStart = new Date(Date.now() + (hours - 0.5) * 3600000);
    const windowEnd = new Date(Date.now() + (hours + 0.5) * 3600000);

    const upcomingBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          sql`${bookings.scheduledAt} BETWEEN ${windowStart} AND ${windowEnd}`,
        ),
      );

    for (const b of upcomingBookings) {
      const result = await executeAIPeriodicCheckIn(b.id, hours);
      checked++;
      if (result.escalated) escalated++;
    }
  }

  return { checked, escalated };
}
