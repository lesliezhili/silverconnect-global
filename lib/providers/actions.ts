"use server";

import { eq, and, sql, or, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerProfiles,
  providerAvailability,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";

// ─── Module 2: ABN Validation ─────────────────────────────────────
/**
 * Validates an Australian Business Number (ABN).
 * In production, calls the ABR (Australian Business Register) API.
 * Currently implements format validation + stub for API integration.
 */
export async function validateABN(abn: string): Promise<{ valid: boolean; error?: string }> {
  // Strip whitespace
  const cleaned = abn.replace(/\s/g, "");

  // ABN must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return { valid: false, error: "ABN must be exactly 11 digits." };
  }

  // ABN checksum algorithm (Modulus 89)
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split("").map(Number);
  digits[0] -= 1; // Subtract 1 from first digit
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);

  if (sum % 89 !== 0) {
    return { valid: false, error: "Invalid ABN checksum. Please verify." };
  }

  // TODO: Real ABR API call for active status verification
  // const abrResult = await fetch(`https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${cleaned}&includeHistoricalDetails=N&authenticationGuid=${process.env.ABR_GUID}`);

  return { valid: true };
}

// ─── Module 2: OnboardProvider ────────────────────────────────────
export interface OnboardProviderInput {
  userId: string;
  serviceTypes: string[];
  baseRate: number;
  servicePostcodes: string[];
  abn?: string;
  country?: string;
  serviceTier?: "level_1" | "level_2" | "level_3";
}

export interface OnboardProviderResult {
  success: boolean;
  error?: string;
  providerId?: string;
  backgroundCheckPending?: boolean;
}

export async function onboardProvider(
  input: OnboardProviderInput,
): Promise<OnboardProviderResult> {
  const {
    userId,
    serviceTypes,
    baseRate,
    servicePostcodes,
    abn,
    country = "AU",
    serviceTier = "level_1",
  } = input;

  // ABN verification for Australian providers
  if (country === "AU") {
    if (!abn) {
      return {
        success: false,
        error: "Australian Business Number (ABN) is mandatory for AU providers.",
      };
    }
    const abnResult = await validateABN(abn);
    if (!abnResult.valid) {
      return {
        success: false,
        error: `Invalid or inactive ABN. Onboarding halted. ${abnResult.error}`,
      };
    }
  }

  // Check if provider profile already exists
  const [existing] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: "Provider profile already exists. Use update instead.",
    };
  }

  // Trigger background check (async — provider starts as pending)
  const backgroundCheckStatus = await triggerBackgroundCheck(userId);

  const initialStatus =
    backgroundCheckStatus === "cleared" ? "approved" : "pending";

  // Insert provider profile
  const [profile] = await db
    .insert(providerProfiles)
    .values({
      userId,
      onboardingStatus: initialStatus,
      bio: null,
      serviceRadiusKm: 15,
      submittedAt: new Date(),
      ...(initialStatus === "approved" ? { approvedAt: new Date() } : {}),
    })
    .returning({ id: providerProfiles.id });

  // Update the user record with provider-specific fields
  // (Using raw SQL for the new columns not yet in Drizzle schema)
  await db.execute(sql`
    UPDATE provider_profiles SET
      abn = ${abn ?? null},
      abn_verified = ${country === "AU"},
      abn_verified_at = ${country === "AU" ? new Date() : null},
      base_hourly_rate = ${baseRate},
      coverage_postcodes = ${servicePostcodes},
      service_tier = ${serviceTier},
      background_check_status = ${backgroundCheckStatus},
      emergency_opt_in = false
    WHERE id = ${profile.id}
  `);

  return {
    success: true,
    providerId: profile.id,
    backgroundCheckPending: backgroundCheckStatus !== "cleared",
  };
}

// ─── Module 2: Background Check Stub ──────────────────────────────
async function triggerBackgroundCheck(
  _userId: string,
): Promise<"pending" | "cleared" | "flagged"> {
  // TODO: Integrate with real third-party screening API
  // For now, return "pending" — admin will manually approve
  // In production:
  // const result = await ThirdPartyScreeningAPI.TriggerCheck(userId);
  // return result.status;
  return "pending";
}

// ─── Module 2: SetAvailabilityWindows ─────────────────────────────
export interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  slot: "morning" | "afternoon" | "evening";
  enabled: boolean;
}

export interface SetAvailabilityResult {
  success: boolean;
  error?: string;
  slotsCreated?: number;
}

export async function setAvailabilityWindows(
  providerId: string,
  slots: AvailabilitySlot[],
): Promise<SetAvailabilityResult> {
  // Check for overlapping entries (same provider + day + slot)
  for (const slot of slots) {
    const [overlap] = await db
      .select({ id: providerAvailability.id })
      .from(providerAvailability)
      .where(
        and(
          eq(providerAvailability.providerId, providerId),
          eq(providerAvailability.dayOfWeek, slot.dayOfWeek),
          eq(providerAvailability.slot, slot.slot),
        ),
      )
      .limit(1);

    if (overlap) {
      // Update existing instead of error
      await db
        .update(providerAvailability)
        .set({ enabled: slot.enabled })
        .where(eq(providerAvailability.id, overlap.id));
    } else {
      await db.insert(providerAvailability).values({
        providerId,
        dayOfWeek: slot.dayOfWeek,
        slot: slot.slot,
        enabled: slot.enabled,
      } as any);
    }
  }

  return { success: true, slotsCreated: slots.length };
}

// ─── Module 2: Toggle Emergency Opt-In ────────────────────────────
export async function toggleEmergencyOptIn(
  providerId: string,
  optIn: boolean,
): Promise<{ success: boolean }> {
  await db.execute(sql`
    UPDATE provider_profiles
    SET emergency_opt_in = ${optIn}
    WHERE id = ${providerId}
  `);
  return { success: true };
}
