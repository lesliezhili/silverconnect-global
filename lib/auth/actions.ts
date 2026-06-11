"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userRoleSwitches } from "@/lib/db/schema/users";
import { providerProfiles } from "@/lib/db/schema/providers";
import { hashPassword } from "./password";
import { signInUser } from "./server";
import type { Role } from "./session";

// ─── Module 1: Language Fallback Logic ────────────────────────────
const SUPPORTED_LANGUAGES = ["en", "zh", "zh_tw", "th", "ko", "ja"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function resolveLanguage(input: string | undefined): SupportedLanguage {
  if (!input) return "en";
  const normalized = input.toLowerCase().replace("-", "_");
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }
  // Graceful fallback to default language
  return "en";
}

// ─── Module 1: SignUp ─────────────────────────────────────────────
export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  selectedLanguage?: string;
  country?: "AU" | "CN" | "CA" | "US" | "TW" | "SG" | "HK" | "MY";
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const { email, password, name, selectedLanguage, country } = input;

  // Validate full name (mandatory per spec)
  if (!fullName || fullName.trim().length < 2) {
    return {
      success: false,
      error: "Full name is required to maintain platform trust."
    };
  }

  // Validate email format
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email address required." };
  }

  // Validate password strength
  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters."
    };
  }

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email.trim()})`)
    .limit(1);

  if (existing.length > 0) {
    return {
      success: false,
      error: "Email already registered. Please login."
    };
  }

  // Language fallback logic per spec
  const assignedLanguage = resolveLanguage(selectedLanguage);

  // Hash password securely
  const passwordHash = await hashPassword(password);

  // Insert new user with default Customer role
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.trim().toLowerCase(),
      passwordHash,
      name: fullName.trim(),
      name: fullName.trim(),
      preferredLanguage: assignedLanguage,
      country: country ?? "AU",
      locale: assignedLanguage === "zh" || assignedLanguage === "zh_tw" ? "zh" : "en",
      largeTextMode: false
    } as any)
    .returning({ id: users.id, email: users.email });

  // Sign in the new user immediately
  await signInUser({
    id: newUser.id,
    email: newUser.email,
    name: fullName.trim(),
    role: "customer"
  });

  return {
    success: true,
    userId: newUser.id
  };
}

// ─── Module 1: SwitchUserRole ─────────────────────────────────────
export interface SwitchRoleInput {
  userId: string;
  targetRole: "customer" | "provider" | "helper" | "admin";
}

export interface SwitchRoleResult {
  success: boolean;
  error?: string;
}

export async function switchUserRole(input: SwitchRoleInput): Promise<SwitchRoleResult> {
  const { userId, targetRole } = input;

  // Get current user
  const [user] = await db
    .select({
      id: users.id,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "User not found." };
  }

  // Provider role requires verified provider profile
  if (targetRole === "provider") {
    const [profile] = await db
      .select({ id: providerProfiles.id, status: providerProfiles.onboardingStatus })
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.status !== "approved") {
      return {
        success: false,
        error: "Provider verification pending. Access blocked."
      };
    }
  }

  // Admin role requires admin base role
  if (targetRole === "admin" && user.role !== "admin") {
    return { success: false, error: "Admin access not permitted." };
  }

  const previousRole = user.role;

  // Update active role
  await db
    .update(users)
    .set({
       targetRole,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  // Log the role switch for audit
  await db.insert(userRoleSwitches).values({
    userId,
    fromRole: previousRole,
    toRole: targetRole
  } as any);

  return { success: true };
}

// ─── Module 1: Update Preferences ────────────────────────────────
export interface UpdatePreferencesInput {
  userId: string;
  preferredLanguage?: string;
  largeTextMode?: boolean;
  fullName?: string;
}

export async function updateUserPreferences(
  input: UpdatePreferencesInput,
): Promise<{ success: boolean; error?: string }> {
  const { userId, preferredLanguage, largeTextMode, name } = input;

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (preferredLanguage !== undefined) {
    updates.preferredLanguage = resolveLanguage(preferredLanguage);
  }
  if (largeTextMode !== undefined) {
    updates.largeTextMode = largeTextMode;
  }
  if (fullName !== undefined && fullName.trim().length >= 2) {
    updates.fullName = fullName.trim();
    updates.name = fullName.trim();
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return { success: true };
}
