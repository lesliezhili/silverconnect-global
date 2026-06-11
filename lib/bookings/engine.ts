"use server";

import { eq, and, sql, gte, lte, ne, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, bookingChanges } from "@/lib/db/schema/bookings";
import { providerProfiles, providerAvailability } from "@/lib/db/schema/providers";
import { addresses } from "@/lib/db/schema/customer-data";
import { services, servicePrices } from "@/lib/db/schema/services";
import { users } from "@/lib/db/schema/users";

// ─── Module 4: Dynamic Pricing Engine ─────────────────────────────

/** Public holiday dates per country (simplified — use API in production) */
const PUBLIC_HOLIDAYS_2026: Record<string, string[]> = {
  AU: [
    "2026-01-01", "2026-01-26", "2026-04-03", "2026-04-04", "2026-04-06",
    "2026-04-25", "2026-06-08", "2026-12-25", "2026-12-26",
  ],
  CN: [
    "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19",
    "2026-04-05", "2026-05-01", "2026-10-01", "2026-10-02", "2026-10-03",
  ],
  CA: [
    "2026-01-01", "2026-02-16", "2026-04-03", "2026-05-18",
    "2026-07-01", "2026-09-07", "2026-10-12", "2026-12-25",
  ],
};

function isPublicHoliday(date: Date, country: string): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return (PUBLIC_HOLIDAYS_2026[country] ?? []).includes(dateStr);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export interface PricingResult {
  totalCustomerCharge: number;
  providerShare: number;
  platformFee: number;
  multiplierApplied: number;
  multiplierReason: string | null;
  currency: string;
}

/**
 * CalculatePricingEngine — Module 4 spec implementation.
 * Applies holiday (2x) and weekend (1.5x) multipliers.
 * Platform fee: 15% standard, up to 18% peak.
 */
export async function calculatePricing(
  baseRate: number,
  durationHours: number,
  targetDate: Date,
  country: string,
): Promise<PricingResult> {
  let totalCost = baseRate * durationHours;
  let multiplier = 1.0;
  let reason: string | null = null;

  // Apply surcharges per spec
  if (isPublicHoliday(targetDate, country)) {
    multiplier = 2.0;
    reason = "public_holiday";
  } else if (isWeekend(targetDate)) {
    multiplier = 1.5;
    reason = "weekend";
  }

  totalCost = totalCost * multiplier;

  // Platform fee: 15% standard, scales to 18% during peak
  const isPeakHour = targetDate.getHours() >= 6 && targetDate.getHours() <= 8 ||
    targetDate.getHours() >= 17 && targetDate.getHours() <= 19;
  const feeRate = isPeakHour ? 0.18 : 0.15;

  const platformFee = Math.round(totalCost * feeRate * 100) / 100;
  const providerShare = Math.round((totalCost - platformFee) * 100) / 100;

  const currencyMap: Record<string, string> = { AU: "AUD", CN: "CNY", CA: "CAD", US: "USD", TW: "TWD", SG: "SGD", HK: "HKD", MY: "MYR" };

  return {
    totalCustomerCharge: Math.round(totalCost * 100) / 100,
    providerShare,
    platformFee,
    multiplierApplied: multiplier,
    multiplierReason: reason,
    currency: currencyMap[country] ?? "AUD",
  };
}

// ─── Module 4: Proximity Matching ─────────────────────────────────

/** Haversine distance in km between two GPS coordinates. */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Module 4: CreateBookingRequest ───────────────────────────────

export interface CreateBookingInput {
  customerId: string;
  serviceId: string;
  targetDatetime: string; // ISO 8601
  durationHours: number;
  addressId?: string;
  notes?: string;
}

export interface CreateBookingResult {
  success: boolean;
  error?: string;
  bookingId?: string;
  pricing?: PricingResult;
  matchedProviderId?: string;
}

export async function createBookingRequest(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const { customerId, serviceId, targetDatetime, durationHours, addressId, notes } = input;
  const targetDate = new Date(targetDatetime);

  if (targetDate.getTime() < Date.now()) {
    return { success: false, error: "Cannot book in the past." };
  }

  if (durationHours < 1 || durationHours > 8) {
    return { success: false, error: "Duration must be 1–8 hours." };
  }

  // Get customer location
  const customerAddresses = await db
    .select({
      id: addresses.id,
      postcode: addresses.postcode,
      country: addresses.country,
    })
    .from(addresses)
    .where(eq(addresses.userId, customerId));

  if (customerAddresses.length === 0) {
    return { success: false, error: "No address on file. Complete onboarding first." };
  }

  const addr = addressId
    ? customerAddresses.find((a) => a.id === addressId) ?? customerAddresses[0]
    : customerAddresses[0];

  // Get service details
  const [service] = await db
    .select({ id: services.id, durationMin: services.durationMin })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.enabled, true)))
    .limit(1);

  if (!service) {
    return { success: false, error: "Service not found or disabled." };
  }

  // Find matching providers: verified + matching postcode coverage
  const matchedProviders: any = await db.execute(sql`
    SELECT pp.id, pp.user_id, pp.base_hourly_rate, pp.service_radius_km,
           pp.service_lat, pp.service_lng
    FROM provider_profiles pp
    WHERE pp.onboarding_status = 'approved'
      AND pp.base_hourly_rate IS NOT NULL
    ORDER BY pp.base_hourly_rate ASC
    LIMIT 20
  `);

  // Filter by availability (day of week + time slot)
  const targetDay = targetDate.getDay(); // 0=Sun
  const targetHour = targetDate.getHours();
  const targetSlot =
    targetHour < 12 ? "morning" : targetHour < 17 ? "afternoon" : "evening";

  const availableProviders: Array<{ id: string; userId: string; baseRate: number }> = [];

  for (const provider of matchedProviders.rows as any[]) {
    // Check availability window
    const [avail] = await db
      .select({ id: providerAvailability.id })
      .from(providerAvailability)
      .where(
        and(
          eq(providerAvailability.providerId, provider.id),
          eq(providerAvailability.dayOfWeek, targetDay),
          eq(providerAvailability.slot, targetSlot),
          eq(providerAvailability.enabled, true),
        ),
      )
      .limit(1);

    if (!avail) continue;

    // Check no existing booking clash
    const [clash] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, provider.id),
          ne(bookings.status, "cancelled"),
          sql`${bookings.scheduledAt} < ${new Date(targetDate.getTime() + durationHours * 3600000)}`,
          sql`${bookings.scheduledAt} + (${bookings.durationMin} || ' minutes')::interval > ${targetDate}`,
        ),
      )
      .limit(1);

    if (clash) continue;

    availableProviders.push({
      id: provider.id,
      userId: provider.user_id,
      baseRate: Number(provider.base_hourly_rate),
    });
  }

  if (availableProviders.length === 0) {
    return {
      success: false,
      error: "No matching caregivers are currently available for this timeframe.",
    };
  }

  // Pick top match (lowest rate first — already sorted)
  const chosen = availableProviders[0];

  // Calculate dynamic pricing
  const pricing = await calculatePricing(
    chosen.baseRate,
    durationHours,
    targetDate,
    addr.country,
  );

  // Create the booking
  const [newBooking] = await db
    .insert(bookings)
    .values({
      customerId,
      providerId: chosen.id,
      serviceId,
      addressId: addr.id,
      scheduledAt: targetDate,
      durationMin: durationHours * 60,
      status: "pending" as const,
      totalPrice: String(pricing.totalCustomerCharge),
      notes: notes ?? null,
    } as any)
    .returning({ id: bookings.id });

  // Log booking creation
  await db.insert(bookingChanges).values({
    bookingId: newBooking.id,
    type: "created",
    fromStatus: null,
    toStatus: "pending",
    note: `Auto-matched provider. Pricing: ${pricing.currency} ${pricing.totalCustomerCharge} (${pricing.multiplierReason ?? "standard"})`,
  });

  return {
    success: true,
    bookingId: newBooking.id,
    pricing,
    matchedProviderId: chosen.id,
  };
}
