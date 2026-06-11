import type { NextRequest } from "next/server";

/**
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` on each
 * scheduled invocation. We verify it so the route can't be triggered
 * by anyone with the URL.
 *
 * Returns null on success, or a Response on failure (caller should
 * `return` it to short-circuit).
 */
export function verifyCronAuth(req: NextRequest): Response | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  const got = req.headers.get("authorization");
  if (got !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
