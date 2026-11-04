import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/server";

export const ADMIN_COOKIE = "sc-admin";
const MAX_AGE = 60 * 60 * 8;

export interface AdminSession {
  signedIn: boolean;
  email?: string;
}

/**
 * Admin panel gate. The sc-admin cookie is unsigned (anyone can set it), so
 * it only counts together with the signed session of a user who is an
 * admin — admin login establishes both.
 */
export async function getAdmin(): Promise<AdminSession> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return { signedIn: false };
  const me = await getCurrentUser();
  if (!me?.isAdmin) return { signedIn: false };
  return { signedIn: true, email: me.email };
}

export async function setAdmin(email: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, encodeURIComponent(email), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
