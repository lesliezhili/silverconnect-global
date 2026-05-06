import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type Role = "customer" | "provider" | "admin";

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

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}

const options: SessionOptions = {
  cookieName: "sc-session",
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

export async function getAuthSession() {
  const store = await cookies();
  return getIronSession<AuthSession>(store, options);
}
