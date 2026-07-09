import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payouts, wallets } from "@/lib/db/schema/payments";
import { providerProfiles } from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

/** POST /api/payments/payout — provider requests payout of available balance */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [profile] = await db.select({ id: providerProfiles.id, stripeAccountId: providerProfiles.stripeAccountId })
      .from(providerProfiles).where(eq(providerProfiles.userId, me.id)).limit(1);
    if (!profile) return NextResponse.json({ error: "No provider profile" }, { status: 404 });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.providerId, profile.id)).limit(1);
    if (!wallet || Number(wallet.balanceAvailable) <= 0) {
      return NextResponse.json({ error: "No available balance" }, { status: 400 });
    }

    const amount = wallet.balanceAvailable;
    const canTransfer = Boolean(profile.stripeAccountId) && isStripeConfigured();
    let transferId: string;

    if (canTransfer) {
      const stripe = getStripeClient();
      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(amount) * 100),
        currency: wallet.currency.toLowerCase(),
        destination: profile.stripeAccountId!,
        metadata: { providerId: profile.id },
      });
      transferId = transfer.id;
    } else {
      transferId = `WALLET-${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    }

    // Create payout record
    await db.insert(payouts).values({
      providerId: profile.id, stripeTransferId: transferId,
      amount, currency: wallet.currency, status: "paid", paidAt: new Date(),
    });

    // Zero out available balance
    await db.update(wallets).set({ balanceAvailable: "0", updatedAt: new Date() })
      .where(eq(wallets.providerId, profile.id));

    return NextResponse.json({ success: true, transferId, amount, currency: wallet.currency, simulated: !canTransfer });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
