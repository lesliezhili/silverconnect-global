import "server-only";
import { getAuthSession, type Role } from "@/lib/auth/session";

export const SESSION_COOKIE = "sc-session";

export interface Session {
  signedIn: boolean;
  userId?: string;
  email?: string;
  name?: string;
  initials?: string;
  role?: Role;
}

/**
 * Read the current iron-session cookie. Sealed cookies that fail to
 * unseal return an empty session (signed-out) rather than throwing.
 */
export async function getSession(): Promise<Session> {
  const s = await getAuthSession();
  if (!s.userId) return { signedIn: false };
  return {
    signedIn: true,
    userId: s.userId,
    email: s.email,
    name: s.name,
    initials: s.initials,
    role: s.role,
  };
}

/**
 * Low-level helper for routes that need to write a session without the
 * full DB user payload. Prefer `signInUser()` from `@/lib/auth/server`
 * once you have a user row in hand.
 */
export async function setSession(input: {
  userId: string;
  email: string;
  name: string;
  role: Role;
  initials?: string;
}): Promise<void> {
  const s = await getAuthSession();
  s.userId = input.userId;
  s.email = input.email;
  s.name = input.name;
  s.role = input.role;
  s.initials =
    input.initials ?? (input.name.slice(0, 1) || "?").toUpperCase();
  await s.save();
}

export async function clearSession(): Promise<void> {
  const s = await getAuthSession();
  s.destroy();
}
