import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { providerProfiles } from "@/lib/db/schema/providers";
import { eq } from "drizzle-orm";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "provider") {
      return NextResponse.json({ error: "Provider account required" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json({
        simulated: true,
        accountId: `acct_sim_${Date.now()}`,
        onboardingUrl: null,
        message: "Stripe not configured — Connect onboarding simulated",
      });
    }

    const stripe = getStripeClient();

    // Check if provider already has a Connect account stored
    const [profile] = await db.select().from(providerProfiles)
      .where(eq(providerProfiles.userId, user.id)).limit(1);

    let accountId = profile?.stripeAccountId ?? null;

    if (!accountId) {
      // Create new Express Connect account
      const account = await stripe.accounts.create({
        type: "express",
        country: "AU",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { provider_id: user.id, platform: "silverconnect" },
      });
      accountId = account.id;

      await db.update(providerProfiles)
        .set({ stripeAccountId: accountId })
        .where(eq(providerProfiles.userId, user.id));
    }

    // Generate onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/en/provider/bank?refresh=true`,
      return_url: `${baseUrl}/en/provider/bank?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expires_at,
    });
  } catch (e: unknown) {
    console.error("[connect-onboard]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
