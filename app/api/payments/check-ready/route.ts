import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema/customer-data";
import { providerProfiles } from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/check-ready
 * Checks if the user has payment method configured:
 * - Customer: needs a credit/debit card on file
 * - Provider: needs BSB + account number for receiving payouts
 * Returns { ready: boolean, missing: string[] }
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const missing: string[] = [];

  // Check customer payment method (card)
  const [card] = await db.select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(eq(paymentMethods.userId, me.id))
    .limit(1);
  if (!card) {
    missing.push("You need to add a credit or debit card before booking a service.");
  }

  // If user is also a provider, check BSB/account
  if (me.role === "provider") {
    const [profile] = await db.select({
      id: providerProfiles.id,
      bsb: providerProfiles.bsb,
      accountNumber: providerProfiles.accountNumber,
    }).from(providerProfiles)
      .where(eq(providerProfiles.userId, me.id))
      .limit(1);

    if (!profile?.bsb || !profile?.accountNumber) {
      missing.push("Service providers need BSB and account number to receive payments.");
    }
  }

  return NextResponse.json({
    ready: missing.length === 0,
    missing,
    hasCard: !!card,
    hasBankAccount: me.role === "provider" ? missing.length === 0 : null,
  });
}
