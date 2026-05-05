import "server-only";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { verificationCodes } from "@/lib/db/schema/users";

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type Purpose = "email_verify" | "password_reset";

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generate6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Issue a fresh code for `email` + `purpose`. Invalidates any prior
 * un-consumed codes for the same (email, purpose) pair so only one is
 * active at a time.
 */
export async function issueCode(
  email: string,
  purpose: Purpose = "email_verify",
): Promise<string> {
  const e = normEmail(email);
  const code = generate6();
  await db.transaction(async (tx) => {
    await tx
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          sql`lower(${verificationCodes.email}) = ${e}`,
          eq(verificationCodes.purpose, purpose),
          isNull(verificationCodes.consumedAt),
        ),
      );
    await tx.insert(verificationCodes).values({
      email: e,
      code,
      purpose,
      expiresAt: new Date(Date.now() + TTL_MS),
    });
  });
  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "wrong" | "missing" | "throttled" };

/**
 * Validate `code` against the most-recent active entry for (email,
 * purpose). On success, marks the row consumed (one-shot). On wrong
 * code, increments attempts; throttles after MAX_ATTEMPTS.
 */
export async function consumeCode(
  email: string,
  code: string,
  purpose: Purpose = "email_verify",
): Promise<VerifyResult> {
  const e = normEmail(email);
  const c = code.trim();
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(verificationCodes)
      .where(
        and(
          sql`lower(${verificationCodes.email}) = ${e}`,
          eq(verificationCodes.purpose, purpose),
          isNull(verificationCodes.consumedAt),
        ),
      )
      .orderBy(sql`${verificationCodes.createdAt} desc`)
      .limit(1);
    const entry = rows[0];
    if (!entry) return { ok: false, reason: "missing" } as const;
    if (entry.expiresAt.getTime() < Date.now()) {
      await tx
        .update(verificationCodes)
        .set({ consumedAt: new Date() })
        .where(eq(verificationCodes.id, entry.id));
      return { ok: false, reason: "expired" } as const;
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      await tx
        .update(verificationCodes)
        .set({ consumedAt: new Date() })
        .where(eq(verificationCodes.id, entry.id));
      return { ok: false, reason: "throttled" } as const;
    }
    if (entry.code !== c) {
      await tx
        .update(verificationCodes)
        .set({ attempts: entry.attempts + 1 })
        .where(eq(verificationCodes.id, entry.id));
      return { ok: false, reason: "wrong" } as const;
    }
    await tx
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(eq(verificationCodes.id, entry.id));
    return { ok: true } as const;
  });
}

/**
 * Dev/test helper: returns the latest active code for an email without
 * consuming it. Only enabled when ALLOW_DEV_PEEK=1.
 */
export async function peekCodeForDev(
  email: string,
  purpose: Purpose = "email_verify",
): Promise<string | null> {
  if (process.env.ALLOW_DEV_PEEK !== "1") return null;
  const e = normEmail(email);
  const rows = await db
    .select({ code: verificationCodes.code })
    .from(verificationCodes)
    .where(
      and(
        sql`lower(${verificationCodes.email}) = ${e}`,
        eq(verificationCodes.purpose, purpose),
        isNull(verificationCodes.consumedAt),
        gt(verificationCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(sql`${verificationCodes.createdAt} desc`)
    .limit(1);
  return rows[0]?.code ?? null;
}
