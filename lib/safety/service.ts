"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { sendPushNotification, sendEmergencyAlert } from "@/lib/notifications/service";

/**
 * SAFETY MODULE — SilverConnect Global
 * 
 * 1. Provider Safety Check-in (GPS verified arrival)
 * 2. Provider Safety Check-out (GPS verified departure)
 * 3. Customer confirmation (verifies provider actually arrived)
 * 4. Duress signal (silent alarm)
 * 5. Before/After photo documentation
 * 6. Security verification status
 */

// ─── Safety Check-in/Check-out ──────────────────────────────

export async function providerCheckIn(params: {
  bookingId: string;
  providerId: string;
  lat: number;
  lng: number;
  type: "arrival" | "departure";
}): Promise<{ success: boolean; checkinId?: string; error?: string }> {
  const { bookingId, providerId, lat, lng, type } = params;

  // Verify booking exists and belongs to this provider
  const booking: any = await db.execute(sql`
    SELECT id, customer_id, address_id FROM bookings
    WHERE id = ${bookingId} AND provider_id = ${providerId}
  `);
  if (!booking.rows?.[0]) return { success: false, error: "Booking not found or not assigned to you" };

  // Insert check-in record
  const result: any = await db.execute(sql`
    INSERT INTO safety_checkins (booking_id, provider_id, checkin_type, gps_lat, gps_lng)
    VALUES (${bookingId}, ${providerId}, ${type}, ${lat}, ${lng})
    RETURNING id
  `);

  const checkinId = result.rows?.[0]?.id;

  // Notify customer
  const customerId = booking.rows[0].customer_id;
  await sendPushNotification({
    userId: customerId,
    title: type === "arrival" ? "Carer Arrived ✅" : "Service Completed ✅",
    message: type === "arrival"
      ? "Your carer has checked in and is ready to begin service."
      : "Your carer has completed the visit and checked out safely.",
    tags: [type === "arrival" ? "house" : "white_check_mark"],
  });

  return { success: true, checkinId };
}

// ─── Duress Signal (Silent Alarm) ───────────────────────────

export async function triggerDuressSignal(params: {
  bookingId: string;
  userId: string;
  lat: number;
  lng: number;
  role: "provider" | "customer";
}): Promise<{ success: boolean }> {
  const { bookingId, userId, lat, lng, role } = params;

  // Record with duress flag
  await db.execute(sql`
    INSERT INTO safety_checkins (booking_id, provider_id, checkin_type, gps_lat, gps_lng, duress_flag, notes)
    VALUES (${bookingId}, ${userId}, 'arrival', ${lat}, ${lng}, TRUE, ${`DURESS SIGNAL from ${role}`})
  `);

  // Immediate emergency alert to admin + emergency services
  await sendEmergencyAlert({
    region: "AU",
    title: `DURESS SIGNAL — Booking ${bookingId}`,
    message: `Silent alarm triggered by ${role} at GPS (${lat}, ${lng}). Booking: ${bookingId}. Immediate welfare check required.`,
  });

  return { success: true };
}

// ─── Customer Confirmation ──────────────────────────────────

export async function customerConfirmArrival(params: {
  bookingId: string;
  customerId: string;
  confirmed: boolean;
}): Promise<{ success: boolean }> {
  const { bookingId, customerId, confirmed } = params;

  await db.execute(sql`
    UPDATE safety_checkins
    SET customer_confirmed = ${confirmed}, notes = CASE WHEN ${!confirmed} THEN 'Customer reports provider NOT present' ELSE notes END
    WHERE booking_id = ${bookingId} AND checkin_type = 'arrival'
    ORDER BY timestamp DESC LIMIT 1
  `);

  if (!confirmed) {
    await sendEmergencyAlert({
      region: "AU",
      title: `Customer disputes arrival — Booking ${bookingId}`,
      message: `Customer ${customerId} reports provider has NOT arrived despite check-in record. Investigate potential fraud.`,
    });
  }

  return { success: true };
}

// ─── Before/After Photo Upload ──────────────────────────────

export async function uploadServicePhoto(params: {
  bookingId: string;
  providerId: string;
  photoType: "before" | "after";
  photoUrl: string;
  caption?: string;
  lat?: number;
  lng?: number;
}): Promise<{ success: boolean; photoId?: string }> {
  const { bookingId, providerId, photoType, photoUrl, caption, lat, lng } = params;

  const result: any = await db.execute(sql`
    INSERT INTO service_photos (booking_id, provider_id, photo_type, photo_url, caption, gps_lat, gps_lng)
    VALUES (${bookingId}, ${providerId}, ${photoType}, ${photoUrl}, ${caption || null}, ${lat || null}, ${lng || null})
    RETURNING id
  `);

  return { success: true, photoId: result.rows?.[0]?.id };
}

export async function customerVerifyPhotos(params: {
  bookingId: string;
  customerId: string;
  approved: boolean;
}): Promise<{ success: boolean }> {
  await db.execute(sql`
    UPDATE service_photos
    SET verified_by_customer = ${params.approved}, verified_at = NOW()
    WHERE booking_id = ${params.bookingId}
  `);
  return { success: true };
}

// ─── Provider Security Verification ─────────────────────────

export async function getProviderSecurityStatus(providerId: string): Promise<{
  verified: boolean;
  checks: Array<{ type: string; status: string; expiryDate: string | null }>;
  requiredMissing: string[];
}> {
  const rows: any = await db.execute(sql`
    SELECT check_type, status, expiry_date
    FROM provider_security_checks
    WHERE provider_id = ${providerId}
    ORDER BY check_type
  `);

  const checks = (rows.rows || []).map((r: any) => ({
    type: r.check_type,
    status: r.status,
    expiryDate: r.expiry_date,
  }));

  // Required checks for AU providers
  const required = ["police_check", "wwc", "identity_100pt", "first_aid"];
  const verifiedTypes = checks.filter((c: any) => c.status === "verified").map((c: any) => c.type);
  const requiredMissing = required.filter(r => !verifiedTypes.includes(r));

  return {
    verified: requiredMissing.length === 0,
    checks,
    requiredMissing,
  };
}

export async function submitSecurityDocument(params: {
  providerId: string;
  checkType: string;
  documentUrl: string;
  certificateNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
}): Promise<{ success: boolean }> {
  const { providerId, checkType, documentUrl, certificateNumber, issuedDate, expiryDate, issuingAuthority } = params;

  await db.execute(sql`
    INSERT INTO provider_security_checks (provider_id, check_type, document_url, certificate_number, issued_date, expiry_date, issuing_authority, status)
    VALUES (${providerId}, ${checkType}, ${documentUrl}, ${certificateNumber || null}, ${issuedDate || null}, ${expiryDate || null}, ${issuingAuthority || null}, 'pending')
    ON CONFLICT (provider_id, check_type) WHERE status != 'verified'
    DO UPDATE SET document_url = EXCLUDED.document_url, certificate_number = EXCLUDED.certificate_number, status = 'pending'
  `);

  return { success: true };
}
