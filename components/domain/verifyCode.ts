import "server-only";

/**
 * In-memory verification code store. Codes expire after 10 minutes.
 *
 * Limitations vs. a real implementation:
 * - Process-local Map: lost on restart, doesn't share across replicas
 * - No rate limiting per email / per IP
 *
 * Acceptable for the demo / single-VPS deploy. When Supabase is wired
 * the same `issueCode` / `consumeCode` API can be backed by a
 * `verification_codes` table with `expires_at` and a unique index.
 */
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Entry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const STORE = new Map<string, Entry>();

function key(email: string): string {
  return email.trim().toLowerCase();
}

function sweep() {
  const now = Date.now();
  for (const [k, v] of STORE) if (v.expiresAt < now) STORE.delete(k);
}

function generate6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function issueCode(email: string): string {
  sweep();
  const code = generate6();
  STORE.set(key(email), {
    code,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
  });
  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "wrong" | "missing" | "throttled" };

export function consumeCode(email: string, code: string): VerifyResult {
  sweep();
  const k = key(email);
  const entry = STORE.get(k);
  if (!entry) return { ok: false, reason: "missing" };
  if (entry.expiresAt < Date.now()) {
    STORE.delete(k);
    return { ok: false, reason: "expired" };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    STORE.delete(k);
    return { ok: false, reason: "throttled" };
  }
  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    return { ok: false, reason: "wrong" };
  }
  STORE.delete(k);
  return { ok: true };
}

/**
 * Dev/test helper: returns the active code for an email without
 * consuming it. Only enabled when ALLOW_DEV_PEEK=1 is set so it
 * never leaks in production.
 */
export function peekCodeForDev(email: string): string | null {
  if (process.env.ALLOW_DEV_PEEK !== "1") return null;
  sweep();
  return STORE.get(key(email))?.code ?? null;
}
