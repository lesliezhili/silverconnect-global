import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sc-admin";
const MAX_AGE = 60 * 60 * 8;

export interface AdminSession {
  signedIn: boolean;
  email?: string;
}

export async function getAdmin(): Promise<AdminSession> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return { signedIn: false };
  try {
    return { signedIn: true, email: decodeURIComponent(raw) };
  } catch {
    return { signedIn: false };
  }
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
