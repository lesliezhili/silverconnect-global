import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema/users";
import { getAuthSession, type Role } from "./session";

export type { Role };

function deriveInitials(name: string | null | undefined, email: string): string {
  const src = (name || email.split("@")[0] || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
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
 * If the cookie points at a deleted/missing user we just return null;
 * cookies can only be mutated in actions/route handlers, so a stale
 * cookie is cleared the next time the user hits a write path
 * (`signOut`, login redirect, etc.) rather than here.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getAuthSession();
  if (!session.userId) return null;
  const u = await findUserById(session.userId);
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

export async function signInUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}): Promise<void> {
  const session = await getAuthSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name ?? user.email.split("@")[0];
  session.initials = deriveInitials(user.name, user.email);
  session.role = user.role;
  await session.save();
}

export async function signOut(): Promise<void> {
  const session = await getAuthSession();
  session.destroy();
}
