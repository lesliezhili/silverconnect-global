/**
 * Phase 1 smoke test: exercises the auth + provider tables end-to-end
 * via Drizzle.
 *
 * Run: `npx tsx scripts/smoke-phase1.ts`
 *
 * The script instantiates its own postgres.js client to avoid pulling
 * `server-only` (which throws when loaded outside Next.js's bundler).
 * It exercises the same schema and helpers (bcrypt password hashing,
 * verification codes) the real server actions use.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { eq, sql, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users, verificationCodes } from "../lib/db/schema/users";
import {
  providerProfiles,
  providerCategories,
  providerAvailability,
} from "../lib/db/schema/providers";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const client = postgres(url, { ssl: "require", prepare: false, max: 5 });
const db = drizzle(client, {
  schema: {
    users,
    verificationCodes,
    providerProfiles,
    providerCategories,
    providerAvailability,
  },
});

const TEST_EMAIL = "phase1-smoke@example.com";
const TEST_PASSWORD = "SmokeTest123";

function check(label: string, ok: boolean, extra?: string) {
  const tag = ok ? "✅" : "❌";
  // eslint-disable-next-line no-console
  console.log(`${tag} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function cleanup() {
  await db
    .delete(users)
    .where(sql`lower(${users.email}) = lower(${TEST_EMAIL})`);
}

async function issueCode(email: string): Promise<string> {
  const e = email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.transaction(async (tx) => {
    await tx
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          sql`lower(${verificationCodes.email}) = ${e}`,
          eq(verificationCodes.purpose, "email_verify"),
          isNull(verificationCodes.consumedAt),
        ),
      );
    await tx.insert(verificationCodes).values({
      email: e,
      code,
      purpose: "email_verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
  });
  return code;
}

async function consumeCode(
  email: string,
  code: string,
): Promise<
  { ok: true } | { ok: false; reason: "wrong" | "expired" | "missing" }
> {
  const e = email.trim().toLowerCase();
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(verificationCodes)
      .where(
        and(
          sql`lower(${verificationCodes.email}) = ${e}`,
          eq(verificationCodes.purpose, "email_verify"),
          isNull(verificationCodes.consumedAt),
        ),
      )
      .orderBy(sql`${verificationCodes.createdAt} desc`)
      .limit(1);
    const entry = rows[0];
    if (!entry) return { ok: false, reason: "missing" } as const;
    if (entry.expiresAt.getTime() < Date.now())
      return { ok: false, reason: "expired" } as const;
    if (entry.code !== code) {
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

async function main() {
  await cleanup();

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const [user] = await db
    .insert(users)
    .values({ email: TEST_EMAIL, passwordHash, role: "customer" })
    .returning();
  check("register: insert user", !!user?.id, user?.id);

  const code = await issueCode(TEST_EMAIL);
  check("verify: issue code", /^\d{6}$/.test(code), code);

  const wrong = await consumeCode(TEST_EMAIL, "000000");
  check(
    "verify: wrong code rejected",
    !wrong.ok && wrong.reason === "wrong",
    JSON.stringify(wrong),
  );

  const good = await consumeCode(TEST_EMAIL, code);
  check("verify: correct code accepted", good.ok, JSON.stringify(good));

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, user.id));
  const [verified] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id));
  check(
    "verify: email_verified_at set",
    !!verified?.emailVerifiedAt,
    verified?.emailVerifiedAt?.toISOString(),
  );

  const loginOk = await bcrypt.compare(TEST_PASSWORD, verified.passwordHash);
  const loginBad = await bcrypt.compare("WrongPass99", verified.passwordHash);
  check("login: correct password verifies", loginOk);
  check("login: wrong password rejected", !loginBad);

  // email lower() unique index
  let dupeError: string | null = null;
  try {
    await db.insert(users).values({
      email: TEST_EMAIL.toUpperCase(),
      passwordHash,
      role: "customer",
    });
  } catch (e) {
    dupeError = e instanceof Error ? e.message : String(e);
  }
  check(
    "schema: case-insensitive email unique",
    dupeError !== null,
    dupeError ? "rejected as expected" : "no error thrown",
  );

  // Provider draft
  const [draft] = await db
    .insert(providerProfiles)
    .values({ userId: user.id, onboardingStatus: "pending" })
    .returning();
  check("provider: draft profile created", !!draft?.id, draft?.id);

  await db
    .update(providerProfiles)
    .set({
      addressLine: "12 Park St, Chatswood NSW",
      bio: "Smoke-test bio.",
      serviceRadiusKm: 12,
    })
    .where(eq(providerProfiles.id, draft.id));

  await db
    .insert(providerCategories)
    .values([
      { providerId: draft.id, category: "cleaning" },
      { providerId: draft.id, category: "cooking" },
    ]);
  const cats = await db
    .select()
    .from(providerCategories)
    .where(eq(providerCategories.providerId, draft.id));
  check("provider: 2 categories saved", cats.length === 2);

  await db.insert(providerAvailability).values([
    { providerId: draft.id, dayOfWeek: 1, slot: "morning" },
    { providerId: draft.id, dayOfWeek: 1, slot: "afternoon" },
    { providerId: draft.id, dayOfWeek: 3, slot: "evening" },
  ]);
  const avails = await db
    .select()
    .from(providerAvailability)
    .where(eq(providerAvailability.providerId, draft.id));
  check("provider: 3 availability slots saved", avails.length === 3);

  // Duplicate availability is rejected by unique index
  let dupAvailError: string | null = null;
  try {
    await db.insert(providerAvailability).values({
      providerId: draft.id,
      dayOfWeek: 1,
      slot: "morning",
    });
  } catch (e) {
    dupAvailError = e instanceof Error ? e.message : String(e);
  }
  check(
    "schema: duplicate availability slot rejected",
    dupAvailError !== null,
    dupAvailError ?? "no error",
  );

  await db
    .update(providerProfiles)
    .set({ onboardingStatus: "docs_review", submittedAt: new Date() })
    .where(eq(providerProfiles.id, draft.id));
  await db.update(users).set({ role: "provider" }).where(eq(users.id, user.id));
  const [finalUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id));
  check(
    "provider: user role flipped to provider",
    finalUser.role === "provider",
    finalUser.role,
  );

  const [finalProfile] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.id, draft.id));
  check(
    "provider: onboarding_status = docs_review",
    finalProfile.onboardingStatus === "docs_review",
    finalProfile.onboardingStatus,
  );

  // Cascade delete verification
  await db.delete(users).where(eq(users.id, user.id));
  const orphanProfile = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.id, draft.id));
  const orphanCats = await db
    .select()
    .from(providerCategories)
    .where(eq(providerCategories.providerId, draft.id));
  const orphanAvails = await db
    .select()
    .from(providerAvailability)
    .where(eq(providerAvailability.providerId, draft.id));
  check(
    "cascade: provider_profiles deleted with user",
    orphanProfile.length === 0,
  );
  check(
    "cascade: provider_categories deleted with provider",
    orphanCats.length === 0,
  );
  check(
    "cascade: provider_availability deleted with provider",
    orphanAvails.length === 0,
  );

  // eslint-disable-next-line no-console
  console.log(
    "\nDone. Exit code:",
    process.exitCode ?? 0,
    process.exitCode ? "(some checks failed)" : "(all green)",
  );
  await client.end();
  process.exit(process.exitCode ?? 0);
}

main().catch(async (e) => {
  // eslint-disable-next-line no-console
  console.error("FATAL:", e);
  await client.end();
  process.exit(1);
});
