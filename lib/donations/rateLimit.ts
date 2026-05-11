import "server-only";

/**
 * In-memory sliding-window rate limiter, keyed by IP. Good enough for the
 * single-VPS donate flow — no Redis dependency. Behind a load balancer or
 * if the API ever runs on multiple Node instances, swap for a shared store.
 *
 * Map auto-prunes on each check (only the keyed entry), so memory stays
 * bounded by the number of distinct active IPs in the last `windowMs`.
 */
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds to wait before the next attempt would succeed. */
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  const arr = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= opts.limit) {
    const oldest = arr[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + opts.windowMs - now) / 1000)),
    };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Best-effort client IP. Trusts `x-forwarded-for` because the VPS sits
 * behind AWS-1 nginx which sets it; falls back to `x-real-ip`. Returns
 * 'unknown' if neither is present (better than throwing).
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
