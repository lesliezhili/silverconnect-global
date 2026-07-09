import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import {
  isSessionSecretConfigured,
  SESSION_COOKIE_NAME,
} from "./session-config";

export type Role = "customer" | "provider";

export interface BookingDraft {
  serviceId?: string;
  providerId?: string;
  addressId?: string;
  /** ISO 8601 timestamp. */
  scheduledAt?: string;
  notes?: string;
}

export interface AuthSession {
  userId?: string;
  email?: string;
  name?: string;
  initials?: string;
  role?: Role;
  /** Multi-step new-booking wizard scratch space; cleared on finalize. */
  bookingDraft?: BookingDraft;
}

function sessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return {
    cookieName: SESSION_COOKIE_NAME,
    password: secret,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.SESSION_COOKIE_SECURE === "false"
          ? false
          : process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getAuthSession() {
  const store = await cookies();
  return getIronSession<AuthSession>(store, sessionOptions());
}

export async function getOptionalAuthSession(): Promise<AuthSession | null> {
  const store = await cookies();
  if (!store.has(SESSION_COOKIE_NAME) || !isSessionSecretConfigured()) {
    return null;
  }

  try {
    return await getIronSession<AuthSession>(store, sessionOptions());
  } catch {
    return null;
  }
}
