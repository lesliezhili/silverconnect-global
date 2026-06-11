"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userRepresentatives } from "@/lib/db/schema/users";
import { addresses, emergencyContacts } from "@/lib/db/schema/customer-data";

// ─── Module 3: OnboardCustomer ────────────────────────────────────
export interface OnboardCustomerInput {
  userId: string;
  flatAddress: string;
  coordinates: { latitude: number; longitude: number };
  emergencyContact: {
    name: string;
    phone: string;
    relationship?: string;
  };
  country?: "AU" | "CN" | "CA" | "US" | "TW" | "SG" | "HK" | "MY";
}

export interface OnboardCustomerResult {
  success: boolean;
  error?: string;
}

export async function onboardCustomer(
  input: OnboardCustomerInput,
): Promise<OnboardCustomerResult> {
  const { userId, flatAddress, coordinates, emergencyContact, country = "AU" } = input;

  // Validate emergency contact (mandatory per spec)
  if (!emergencyContact.phone || !emergencyContact.name) {
    return {
      success: false,
      error: "An emergency contact is mandatory for participant safety.",
    };
  }

  if (emergencyContact.phone.replace(/[^0-9+]/g, "").length < 8) {
    return {
      success: false,
      error: "Emergency contact phone number appears invalid.",
    };
  }

  // Validate GPS coordinates
  if (
    !coordinates ||
    coordinates.latitude < -90 ||
    coordinates.latitude > 90 ||
    coordinates.longitude < -180 ||
    coordinates.longitude > 180
  ) {
    return {
      success: false,
      error: "Geographical positioning failure. Please check address coordinates.",
    };
  }

  // Insert address with GPS coordinates
  await db.insert(addresses).values({
    userId,
    label: "Primary",
    line1: flatAddress,
    suburb: "",
    state: "",
    postcode: "",
    country,
  } as any);

  // Update coordinates via raw SQL (new columns)
  await db.execute(sql`
    UPDATE addresses SET
      latitude = ${coordinates.latitude},
      longitude = ${coordinates.longitude},
      gps_verified = true
    WHERE user_id = ${userId}
    AND label = 'Primary'
  `);

  // Insert emergency contact
  await db.insert(emergencyContacts).values({
    userId,
    name: emergencyContact.name,
    phone: emergencyContact.phone,
    relationship: emergencyContact.relationship ?? "family",
  } as any);

  // Update onboarding status
  await db.execute(sql`
    UPDATE users SET
      customer_onboarding_status = 'ready_to_book',
      onboarding_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${userId}
  `);

  return { success: true };
}

// ─── Module 3: LinkRepresentative ─────────────────────────────────
export interface LinkRepresentativeInput {
  elderUserId: string;
  representativeUserId: string;
  authorizationDocUrl?: string;
}

export interface LinkRepresentativeResult {
  success: boolean;
  error?: string;
}

export async function linkRepresentative(
  input: LinkRepresentativeInput,
): Promise<LinkRepresentativeResult> {
  const { elderUserId, representativeUserId, authorizationDocUrl } = input;

  // Consent validation document required per spec
  if (!authorizationDocUrl) {
    return {
      success: false,
      error: "Consent validation document missing.",
    };
  }

  // Verify both users exist
  const [elder] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, elderUserId))
    .limit(1);
  const [rep] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, representativeUserId))
    .limit(1);

  if (!elder || !rep) {
    return { success: false, error: "One or both users not found." };
  }

  // Prevent self-linking
  if (elderUserId === representativeUserId) {
    return { success: false, error: "Cannot link a user as their own representative." };
  }

  // Check if already linked
  const [existing] = await db
    .select({ id: userRepresentatives.id })
    .from(userRepresentatives)
    .where(
      sql`${userRepresentatives.elderUserId} = ${elderUserId}
          AND ${userRepresentatives.representativeUserId} = ${representativeUserId}
          AND ${userRepresentatives.revokedAt} IS NULL`,
    )
    .limit(1);

  if (existing) {
    return { success: false, error: "Representative linkage already exists." };
  }

  // Create the delegation
  await db.insert(userRepresentatives).values({
    elderUserId,
    representativeUserId,
    authorizationDocUrl,
    verified: true,
  } as any);

  return { success: true };
}

// ─── Module 3: Revoke Representative ──────────────────────────────
export async function revokeRepresentative(
  elderUserId: string,
  representativeUserId: string,
): Promise<{ success: boolean }> {
  await db.execute(sql`
    UPDATE user_representatives SET
      revoked_at = NOW(),
      verified = false
    WHERE elder_user_id = ${elderUserId}
      AND representative_user_id = ${representativeUserId}
      AND revoked_at IS NULL
  `);
  return { success: true };
}
