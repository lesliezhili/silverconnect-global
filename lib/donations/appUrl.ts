import "server-only";

/**
 * Returns the canonical site URL for server-side absolute URL construction
 * (Stripe success_url/cancel_url, email links, etc).
 *
 * Reads `process.env.APP_URL` lazily and validates only at call time — not
 * at module import — so non-payment paths (progress queries, webhook
 * dispatch, tests) don't crash if APP_URL is missing.
 *
 * Use with `new URL(path, getAppUrl()).toString()` to safely join paths
 * regardless of whether APP_URL has a trailing slash.
 *
 * NOT a fallback for `NEXT_PUBLIC_APP_URL` — that var is build-time-inlined
 * into the client bundle and stale after a domain change.
 */
export function getAppUrl(): URL {
  const raw = process.env.APP_URL;
  if (!raw) {
    throw new Error(
      "APP_URL env var is required for server-side absolute URL construction. " +
        "Set it in /opt/silverconnect/.env.local on VPS, e.g. APP_URL=https://silverconnect.xinxinsoft.org",
    );
  }
  // `new URL` throws on garbage; that's the right behavior at call time.
  return new URL(raw);
}

/** Convenience: build an absolute URL for a path on the canonical site. */
export function absoluteUrl(path: string): string {
  return new URL(path, getAppUrl()).toString();
}
