import "server-only";
import { createHash, randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coinAccounts, coinLedgerEntries, coinPerkUnlocks } from "@/lib/db/schema/coins";
import { users } from "@/lib/db/schema/users";

/**
 * Internal, non-financial coin ledger — Australia only.
 *
 * Coins are earned by registering and by completing paid bookings, and
 * spent only on non-cash recognition perks (badges, a public wall of
 * honor). They are never redeemable for cash, never transferable
 * between users, and never accepted as payment for services — this is a
 * closed-loop loyalty mechanic, not a currency, security, or
 * cryptocurrency. There is no real wallet, no on-chain transaction, no
 * gas fee: "blockchain" here means an internal, tamper-evident,
 * append-only ledger where every transaction writes three linked rows
 * (a debit, a credit, and a hash-chained receipt) — the "triple-entry"
 * pattern — so the full history can be independently re-verified (see
 * verifyChain below). Keeping it closed-loop and non-cashable is
 * deliberate: it keeps this a marketing/loyalty program rather than a
 * financial product requiring AUSTRAC/ASIC registration.
 */

export const REGISTRATION_BONUS = "50.00";
export const BOOKING_COMPLETED_REWARD = "10.00";

export const PERK_CATALOG = {
  founding_badge: { cost: "100.00", nameEn: "Founding Member badge" },
  priority_support: { cost: "150.00", nameEn: "Priority Support flag" },
  wall_of_honor: { cost: "200.00", nameEn: "Wall of Honor listing" },
} as const;

export type PerkKey = keyof typeof PERK_CATALOG;

function computeHash(prevHash: string | null, payload: Record<string, unknown>): string {
  const canonical = JSON.stringify({ prevHash, ...payload }, Object.keys({ prevHash, ...payload }).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Writes the three linked rows for one transaction (debit the system
 * pool, credit the user, then a receipt hashing both) inside the
 * caller's open transaction, chaining off the current global chain head.
 */
async function writeTripleEntry(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  args: { userId: string; amount: number; reason: string; poolRef: string },
) {
  const { userId, amount, reason, poolRef } = args;
  const transactionId = randomUUID();

  const [head] = await tx
    .select({ hash: coinLedgerEntries.hash })
    .from(coinLedgerEntries)
    .orderBy(desc(coinLedgerEntries.seq))
    .limit(1);
  let prev: string | null = head?.hash ?? null;

  const debitPayload = { transactionId, entryRole: "debit", accountRef: poolRef, userId: null as string | null, amount: (-amount).toFixed(2), reason };
  const debitHash = computeHash(prev, debitPayload);
  await tx.insert(coinLedgerEntries).values({ ...debitPayload, prevHash: prev, hash: debitHash });
  prev = debitHash;

  const creditPayload = { transactionId, entryRole: "credit", accountRef: `user:${userId}`, userId, amount: amount.toFixed(2), reason };
  const creditHash = computeHash(prev, creditPayload);
  await tx.insert(coinLedgerEntries).values({ ...creditPayload, prevHash: prev, hash: creditHash });
  prev = creditHash;

  const receiptPayload = { transactionId, entryRole: "receipt", accountRef: "receipt", userId, amount: amount.toFixed(2), reason };
  const receiptHash = computeHash(prev, receiptPayload);
  await tx.insert(coinLedgerEntries).values({ ...receiptPayload, prevHash: prev, hash: receiptHash });

  return { transactionId, receiptHash };
}

async function ensureAccount(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], userId: string) {
  const [existing] = await tx.select().from(coinAccounts).where(eq(coinAccounts.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await tx.insert(coinAccounts).values({ userId }).returning();
  return created;
}

/**
 * Mints coins into a user's account. Best-effort by convention — callers
 * (signup, booking feedback) wrap this in try/catch so a ledger hiccup
 * never blocks the underlying customer-facing action.
 */
export async function mintCoins(userId: string, amount: string, reason: string, poolRef: string) {
  const amt = Number(amount);
  if (!(amt > 0)) return null;

  return db.transaction(async (tx) => {
    const account = await ensureAccount(tx, userId);
    const { transactionId, receiptHash } = await writeTripleEntry(tx, { userId, amount: amt, reason, poolRef });
    const newBalance = (Number(account.balance) + amt).toFixed(2);
    await tx.update(coinAccounts).set({ balance: newBalance, updatedAt: new Date() }).where(eq(coinAccounts.id, account.id));
    return { transactionId, receiptHash, balance: newBalance };
  });
}

export class InsufficientCoinsError extends Error {}
export class PerkAlreadyUnlockedError extends Error {}

/**
 * Redeems a perk for coins. Deducts the balance, writes the matching
 * triple-entry rows, and records the one-time unlock. Perks are
 * one-per-user — redeeming twice throws PerkAlreadyUnlockedError.
 */
export async function redeemPerk(userId: string, perkKey: PerkKey) {
  const perk = PERK_CATALOG[perkKey];
  if (!perk) throw new Error("Unknown perk");

  return db.transaction(async (tx) => {
    const [already] = await tx
      .select({ id: coinPerkUnlocks.id })
      .from(coinPerkUnlocks)
      .where(and(eq(coinPerkUnlocks.userId, userId), eq(coinPerkUnlocks.perkKey, perkKey)))
      .limit(1);
    if (already) throw new PerkAlreadyUnlockedError(perkKey);

    const account = await ensureAccount(tx, userId);
    const cost = Number(perk.cost);
    if (Number(account.balance) < cost) throw new InsufficientCoinsError(perkKey);

    const { transactionId, receiptHash } = await writeTripleEntry(tx, {
      userId,
      amount: -cost,
      reason: `redeem_${perkKey}`,
      poolRef: "system:redemption_pool",
    });
    const newBalance = (Number(account.balance) - cost).toFixed(2);
    await tx.update(coinAccounts).set({ balance: newBalance, updatedAt: new Date() }).where(eq(coinAccounts.id, account.id));
    await tx.insert(coinPerkUnlocks).values({ userId, perkKey });

    return { transactionId, receiptHash, balance: newBalance };
  });
}

/** Server-side gate — the coin ledger is Australia-only. */
export async function isAuUser(userId: string): Promise<boolean> {
  const [row] = await db.select({ country: users.country }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.country === "AU";
}

export async function getAccountSummary(userId: string) {
  const [account] = await db.select().from(coinAccounts).where(eq(coinAccounts.userId, userId)).limit(1);
  const ledger = await db
    .select()
    .from(coinLedgerEntries)
    .where(eq(coinLedgerEntries.userId, userId))
    .orderBy(desc(coinLedgerEntries.seq))
    .limit(50);
  const unlocks = await db.select().from(coinPerkUnlocks).where(eq(coinPerkUnlocks.userId, userId));
  return {
    balance: account?.balance ?? "0.00",
    ledger,
    unlockedPerks: unlocks.map((u) => u.perkKey),
  };
}

/**
 * Recomputes the global hash chain from the beginning and confirms every
 * row's hash matches what its stored prevHash + fields should produce.
 * This is the "blockchain" transparency check — anyone can prove the
 * ledger hasn't been silently edited.
 */
export async function verifyChain(): Promise<{ valid: boolean; checked: number; brokenAtSeq: number | null }> {
  const rows = await db.select().from(coinLedgerEntries).orderBy(coinLedgerEntries.seq);
  let prev: string | null = null;
  for (const row of rows) {
    const payload = { transactionId: row.transactionId, entryRole: row.entryRole, accountRef: row.accountRef, userId: row.userId, amount: row.amount, reason: row.reason };
    const expected = computeHash(prev, payload);
    if (expected !== row.hash || row.prevHash !== prev) {
      return { valid: false, checked: rows.length, brokenAtSeq: row.seq };
    }
    prev = row.hash;
  }
  return { valid: true, checked: rows.length, brokenAtSeq: null };
}
