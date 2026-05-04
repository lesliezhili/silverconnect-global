import { cookies } from "next/headers";

export const SESSION_COOKIE = "sc-session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Server Action / Route Handler helper. Writes a mock session cookie
 * matching the `name|initials` shape expected by getSession(). Real
 * Supabase Auth integration will replace the body but keep the same
 * signature so call sites don't change.
 */
export async function setSession(name: string, initials?: string): Promise<void> {
  const ini = (initials || name.slice(0, 1) || "?").toUpperCase();
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    `${encodeURIComponent(name)}|${encodeURIComponent(ini)}`,
    {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    }
  );
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export interface Session {
  signedIn: boolean;
  /** Display name; only present when signedIn. */
  name?: string;
  /** 1-2 char initials for the avatar. */
  initials?: string;
}

/**
 * Server-only session reader. Reads a `sc-session` cookie produced by
 * the auth API; absent or empty cookie means signed-out. The cookie
 * format is intentionally simple — `name|initials` URL-encoded — so
 * we can stub it from dev-tools while the real auth integration lands.
 */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return { signedIn: false };
  try {
    const decoded = decodeURIComponent(raw);
    const [name, initials] = decoded.split("|");
    if (!name) return { signedIn: false };
    return {
      signedIn: true,
      name,
      initials: initials || name.slice(0, 1).toUpperCase(),
    };
  } catch {
    return { signedIn: false };
  }
}
