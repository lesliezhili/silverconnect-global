import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { referralCodes, referrals } from "@/lib/db/schema/referrals";

function randomCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 ambiguity
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Returns the user's existing referral code, or lazily creates one.
 * Retries a few times on the (very unlikely) chance of a code collision.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [existing] = await db
    .select({ code: referralCodes.code })
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(referralCodes)
        .values({ userId, code: randomCode() })
        .returning({ code: referralCodes.code });
      return row.code;
    } catch {
      // Unique constraint collision on `code` (or a concurrent insert for
      // this same user) — re-check for an existing row before retrying.
      const [nowExisting] = await db
        .select({ code: referralCodes.code })
        .from(referralCodes)
        .where(eq(referralCodes.userId, userId))
        .limit(1);
      if (nowExisting) return nowExisting.code;
    }
  }
  throw new Error("Could not generate a unique referral code");
}

/**
 * Records that `refereeUserId` signed up via `code`, if the code is
 * valid, isn't the new user's own code, and this user hasn't already
 * been attributed to a referral. Silently no-ops otherwise — referral
 * attribution should never block or fail a signup.
 */
export async function attributeReferral(
  refereeUserId: string,
  code: string,
): Promise<void> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return;

  const [owner] = await db
    .select({ userId: referralCodes.userId })
    .from(referralCodes)
    .where(eq(referralCodes.code, trimmed))
    .limit(1);
  if (!owner || owner.userId === refereeUserId) return;

  try {
    await db.insert(referrals).values({
      referrerUserId: owner.userId,
      refereeUserId,
      referralCode: trimmed,
      status: "pending",
    });
  } catch {
    // referee already has a referral row (unique constraint) — ignore.
  }
}
