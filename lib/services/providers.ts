import { providerProfiles, abnVerifications, backgroundChecks } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

interface OnboardProviderInput {
  userId: string;
  serviceTypes: string[];
  baseRate: number;
  servicePostcodes: string[];
  abn?: string;
  country: string;
}

interface OnboardProviderResult {
  success: boolean;
  message: string;
  data?: {
    providerId: string;
    status: string;
    abnVerificationRequired: boolean;
    backgroundCheckRequired: boolean;
  };
  error?: string;
}

// Mock ABN verification (in production, integrate with ABR API)
async function verifyABNMock(abn: string, country: string): Promise<{
  isActive: boolean;
  businessName?: string;
  error?: string;
}> {
  // Simulate ABN validation: must be 11 digits
  if (!/^\d{11}$/.test(abn)) {
    return { isActive: false, error: "Invalid ABN format" };
  }

  // Mock successful verification for development
  return {
    isActive: true,
    businessName: `Provider Business ${abn}`,
  };
}

// Mock background check trigger (in production, integrate with 3rd party API)
async function triggerBackgroundCheckMock(userId: string): Promise<{
  reference: string;
  status: "pending" | "flagged";
  error?: string;
}> {
  // Mock: return pending status
  return {
    reference: `BG-${userId.slice(0, 8)}-${Date.now()}`,
    status: "pending",
  };
}

export async function OnboardProvider(input: OnboardProviderInput): Promise<OnboardProviderResult> {
  // Validate input
  if (!input.userId || !input.serviceTypes || !input.baseRate) {
    return {
      success: false,
      message: "Missing required fields",
      error: "userId, serviceTypes, and baseRate are required",
    };
  }

  // Australia-specific ABN verification (if applicable)
  let abnVerificationStatus = "not_required";
  if (input.country === "AU" && input.abn) {
    const abnVerification = await verifyABNMock(input.abn, input.country);

    if (!abnVerification.isActive) {
      return {
        success: false,
        message: "Invalid or inactive ABN. Onboarding halted.",
        error: abnVerification.error || "ABN verification failed",
      };
    }

    abnVerificationStatus = "verified";
  }

  // Trigger background check
  const backgroundCheck = await triggerBackgroundCheckMock(input.userId);

  if (backgroundCheck.status === "flagged") {
    return {
      success: false,
      message: "Background check flagged. Activation withheld.",
      error: "Background check result flagged for review",
    };
  }

  try {
    // Create provider profile with transaction
    const providerProfile = await db.transaction(async (tx) => {
      // Insert provider profile
      const [profile] = await tx
        .insert(providerProfiles)
        .values({
          userId: input.userId,
          serviceRadiusKm: 15,
          onboardingStatus: "pending",
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Record ABN verification if applicable
      if (input.abn) {
        await tx.insert(abnVerifications).values({
          providerId: profile.id,
          abn: input.abn,
          status: abnVerificationStatus,
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Record background check request
      await tx.insert(backgroundChecks).values({
        providerId: profile.id,
        checkReference: backgroundCheck.reference,
        status: "pending",
        externalProviderName: "mock_service",
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return profile;
    });

    return {
      success: true,
      message: "Provider onboarding initiated. Verification in progress.",
      data: {
        providerId: providerProfile.id,
        status: "pending",
        abnVerificationRequired: input.country === "AU" && !!input.abn,
        backgroundCheckRequired: true,
      },
    };
  } catch (error) {
    console.error("OnboardProvider error:", error);
    return {
      success: false,
      message: "Failed to onboard provider",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface SetAvailabilityWindowsInput {
  providerId: string;
  weeklySlots: Array<{
    dayOfWeek: number; // 0-6 (Mon-Sun)
    startHour: number;
    endHour: number;
  }>;
}

interface SetAvailabilityWindowsResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function SetAvailabilityWindows(
  input: SetAvailabilityWindowsInput,
): Promise<SetAvailabilityWindowsResult> {
  // Validate input
  if (!input.providerId || !input.weeklySlots || input.weeklySlots.length === 0) {
    return {
      success: false,
      message: "Invalid input",
      error: "providerId and weeklySlots are required",
    };
  }

  // Check for overlapping slots
  for (let i = 0; i < input.weeklySlots.length; i++) {
    for (let j = i + 1; j < input.weeklySlots.length; j++) {
      const slot1 = input.weeklySlots[i];
      const slot2 = input.weeklySlots[j];

      // Check if same day and overlapping times
      if (slot1.dayOfWeek === slot2.dayOfWeek) {
        if (slot1.startHour < slot2.endHour && slot1.endHour > slot2.startHour) {
          return {
            success: false,
            message: "Time window conflicts with an existing slot.",
            error: `Overlap detected on day ${slot1.dayOfWeek}`,
          };
        }
      }
    }
  }

  try {
    // TODO: Insert availability slots into provider_availability table
    // For now, just return success

    return {
      success: true,
      message: "Availability calendar saved.",
    };
  } catch (error) {
    console.error("SetAvailabilityWindows error:", error);
    return {
      success: false,
      message: "Failed to save availability",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper to get provider onboarding status
export async function getProviderOnboardingStatus(providerId: string) {
  const profile = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.id, providerId))
    .limit(1);

  if (profile.length === 0) {
    return null;
  }

  const abnCheck = await db
    .select()
    .from(abnVerifications)
    .where(eq(abnVerifications.providerId, providerId))
    .limit(1);

  const bgCheck = await db
    .select()
    .from(backgroundChecks)
    .where(eq(backgroundChecks.providerId, providerId))
    .limit(1);

  return {
    profile: profile[0],
    abnVerification: abnCheck[0] || null,
    backgroundCheck: bgCheck[0] || null,
  };
}
