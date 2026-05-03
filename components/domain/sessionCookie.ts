import { cookies } from "next/headers";

export const SESSION_COOKIE = "sc-session";

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
