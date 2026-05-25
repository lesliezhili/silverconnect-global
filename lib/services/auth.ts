import { users, userRoles } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SUPPORTED_LANGUAGES = ["en", "zh-Hans", "th", "ja"];
const DEFAULT_LANGUAGE = "en";

interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  selectedLanguage: string;
  country: string;
}

interface SignUpResult {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    preferredLanguage: string;
  };
  error?: string;
}

export async function SignUp(input: SignUpInput): Promise<SignUpResult> {
  // Validate input
  if (!input.email || !input.password || !input.fullName) {
    return {
      success: false,
      message: "Missing required fields",
      error: "Email, password, and full name are required",
    };
  }

  // Validate full name is not empty
  if (input.fullName.trim().length === 0) {
    return {
      success: false,
      message: "Full name is required to maintain platform trust.",
      error: "Full name cannot be empty",
    };
  }

  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      success: false,
      message: "Email already registered. Please login.",
      error: "Email already in use",
    };
  }

  // Language Fallback Logic
  const assignedLanguage = SUPPORTED_LANGUAGES.includes(input.selectedLanguage)
    ? input.selectedLanguage
    : DEFAULT_LANGUAGE;

  // Hash password securely
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(input.password, saltRounds);

  try {
    // Create new user with transaction
    const newUser = await db.transaction(async (tx) => {
      // Insert user
      const [user] = await tx
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          passwordHash: hashedPassword,
          name: input.fullName,
          locale: assignedLanguage as any,
          country: (input.country || "AU") as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Assign default Customer role
      await tx.insert(userRoles).values({
        userId: user.id,
        currentActiveRole: "customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return user;
    });

    return {
      success: true,
      message: "Account created successfully. Welcome to SilverConnect!",
      data: {
        userId: newUser.id,
        email: newUser.email,
        preferredLanguage: assignedLanguage,
      },
    };
  } catch (error) {
    console.error("SignUp error:", error);
    return {
      success: false,
      message: "Failed to create account",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface SwitchRoleInput {
  userId: string;
  targetRole: "customer" | "provider" | "admin";
}

interface SwitchRoleResult {
  success: boolean;
  message: string;
  currentRole?: string;
  error?: string;
}

export async function SwitchUserRole(input: SwitchRoleInput): Promise<SwitchRoleResult> {
  // Validate user exists
  const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);

  if (user.length === 0) {
    return {
      success: false,
      message: "User not found",
      error: "Invalid user ID",
    };
  }

  // For Provider role: would verify provider profile status here
  // (in full implementation, check provider_profiles.onboarding_status == "approved")
  if (input.targetRole === "provider") {
    // TODO: Verify provider verification status from service_providers table
    // For now, allow the switch
  }

  try {
    // Update user role
    await db
      .update(userRoles)
      .set({
        currentActiveRole: input.targetRole,
        updatedAt: new Date(),
      })
      .where(eq(userRoles.userId, input.userId));

    return {
      success: true,
      message: `Switched role to ${input.targetRole} dynamically.`,
      currentRole: input.targetRole,
    };
  } catch (error) {
    console.error("SwitchUserRole error:", error);
    return {
      success: false,
      message: "Failed to switch role",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a number" };
  }
  return { valid: true };
}

export function validateFullName(fullName: string): { valid: boolean; message?: string } {
  const trimmed = fullName.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "Full name is required" };
  }
  if (trimmed.length < 2) {
    return { valid: false, message: "Full name must be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: "Full name must not exceed 100 characters" };
  }
  return { valid: true };
}
