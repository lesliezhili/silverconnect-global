"use server";

import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema/organizations";
import { validateABN } from "@/lib/providers/actions";

export interface RegisterOrganizationInput {
  ownerUserId: string;
  name: string;
  abn: string;
  addressLine: string;
  region: string;
  contactPhone: string;
  contactEmail: string;
  capacity?: number;
  operatingHours?: string;
  description?: string;
}

export interface RegisterOrganizationResult {
  success: boolean;
  organizationId?: string;
  error?: string;
}

export async function registerOrganization(
  input: RegisterOrganizationInput,
): Promise<RegisterOrganizationResult> {
  const required: (keyof RegisterOrganizationInput)[] = [
    "name",
    "abn",
    "addressLine",
    "region",
    "contactPhone",
    "contactEmail",
  ];
  for (const field of required) {
    if (!input[field] || String(input[field]).trim().length === 0) {
      return { success: false, error: `${field} is required` };
    }
  }

  const abnCheck = await validateABN(input.abn);
  if (!abnCheck.valid) {
    return { success: false, error: abnCheck.error || "Invalid ABN" };
  }

  const [row] = await db
    .insert(organizationProfiles)
    .values({
      ownerUserId: input.ownerUserId,
      name: input.name.trim(),
      abn: input.abn.replace(/\s/g, ""),
      addressLine: input.addressLine.trim(),
      region: input.region,
      contactPhone: input.contactPhone.trim(),
      contactEmail: input.contactEmail.trim().toLowerCase(),
      capacity: input.capacity,
      operatingHours: input.operatingHours?.trim() || null,
      description: input.description?.trim() || null,
      onboardingStatus: "pending",
      submittedAt: new Date(),
    })
    .returning({ id: organizationProfiles.id });

  return { success: true, organizationId: row.id };
}
