import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/payment-provider — Check current payment provider
 * POST /api/admin/payment-provider — Switch payment provider
 * 
 * Providers:
 *   "stripe_xero" = Stripe (payments) + Xero (invoicing) — PAID
 *   "phledger"    = PHLedger PayTo + Native Invoicing — FREE
 */

export async function GET() {
  const provider = process.env.PAYMENT_PROVIDER || "stripe_xero";
  const phledgerUrl = process.env.PHLEDGER_API_URL || "https://phledgertax.vercel.app";

  // Check PHLedger connectivity if selected
  let phledgerStatus = "not_checked";
  if (provider === "phledger") {
    try {
      const resp = await fetch(`${phledgerUrl}/api/status`, { signal: AbortSignal.timeout(5000) });
      phledgerStatus = resp.ok ? "connected" : `error_${resp.status}`;
    } catch {
      phledgerStatus = "unreachable";
    }
  }

  return NextResponse.json({
    currentProvider: provider,
    description: provider === "phledger"
      ? "🆓 PHLedger (PayTo + Native Invoicing) — $0/month"
      : "💳 Stripe + Xero — ~$2,500/month at scale",
    phledgerUrl,
    phledgerStatus,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    xeroConfigured: !!process.env.XERO_CLIENT_ID,
    howToSwitch: {
      toFree: "Set PAYMENT_PROVIDER=phledger in Vercel env vars",
      toPaid: "Set PAYMENT_PROVIDER=stripe_xero (or remove the variable)",
      phledgerSetup: "Set PHLEDGER_API_URL to your PHLedger deployment URL",
    },
    costComparison: {
      per100Booking: {
        stripe_xero: { payment: "$2.00", invoice: "$0.03", total: "$2.03" },
        phledger: { payment: "$0.00", invoice: "$0.00", total: "$0.00" },
      },
      monthly1000Bookings: {
        stripe_xero: "$2,750+ (Stripe fees + Xero subscription)",
        phledger: "$0 (open-source, PayTo NPP is free)",
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const { provider } = await req.json();
  
  if (!["stripe_xero", "phledger"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider. Use 'stripe_xero' or 'phledger'" }, { status: 400 });
  }

  // Note: This doesn't persist (env vars are immutable at runtime)
  // User needs to set PAYMENT_PROVIDER in Vercel dashboard
  return NextResponse.json({
    message: `To switch to ${provider}, set PAYMENT_PROVIDER=${provider} in Vercel → Settings → Environment Variables, then redeploy.`,
    provider,
    steps: provider === "phledger" ? [
      "1. Deploy PHLedger: vercel deploy (from phledgertax repo)",
      "2. Set PHLEDGER_API_URL=https://your-phledger.vercel.app in SilverConnect env",
      "3. Set PAYMENT_PROVIDER=phledger in SilverConnect env",
      "4. Redeploy SilverConnect",
    ] : [
      "1. Ensure STRIPE_SECRET_KEY is set",
      "2. Ensure XERO_CLIENT_ID + XERO_CLIENT_SECRET are set",
      "3. Set PAYMENT_PROVIDER=stripe_xero (or remove it)",
      "4. Redeploy SilverConnect",
    ],
  });
}
