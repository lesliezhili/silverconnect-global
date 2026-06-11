import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { getOptionalAuthSession } from "./session";
import { hashPassword as rawHash, verifyPassword } from "./password";

export { rawHash as hashPassword, verifyPassword };

export type Role = "customer" | "provider" | "admin";

function deriveInitials(name: string | null | undefined, email: string): string {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
  initials: string;
}

/**
 * Read-only — safe to call from Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getOptionalAuthSession();
  if (!session?.userId) return null;
  // Guard: old corrupt sessions may have stored a full user object instead of a string.
  // If userId is not a plain string, silently treat as logged-out.
  const userId = typeof session.userId === "string" ? session.userId : null;
  if (!userId) return null;
  const u = await findUserById(userId);
  if (!u || u.deletedAt) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerifiedAt !== null,
    initials: deriveInitials(u.name, u.email),
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== role) throw new Error("FORBIDDEN");
  return u;
}

type User = typeof users.$inferSelect;

/**
 * Sign in a user by setting the session cookie.
 * Called after password verification.
 */
export async function signInUser(userId: string): Promise<void> {
  const { getAuthSession } = await import("./session");
  const session = await getAuthSession();
  session.userId = userId;
  await session.save();
}

/**
 * Sign out — destroys the session cookie.
 */
export async function signOut(): Promise<void> {
  const { getAuthSession } = await import("./session");
  const session = await getAuthSession();
  session.destroy();
}
