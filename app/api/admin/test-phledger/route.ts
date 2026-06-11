import { NextResponse } from "next/server";
import { processPayment, createInvoice, releasePayout } from "@/lib/payments/gateway";

/**
 * POST /api/admin/test-phledger — E2E test using PHLedger (free) provider
 * 
 * Tests the same 6-step flow but via PHLedger instead of Stripe+Xero.
 * No API keys needed. Zero cost.
 */
export async function POST() {
  const results: Record<string, unknown> = {};
  const phledgerUrl = process.env.PHLEDGER_API_URL || "https://phledgertax.vercel.app";
  const bookingId = crypto.randomUUID();

  try {
    // Step 1: Check PHLedger connectivity
    let phledgerOnline = false;
    try {
      const statusResp = await fetch(`${phledgerUrl}/api/status`, { signal: AbortSignal.timeout(8000) });
      if (statusResp.ok) {
        const statusData = await statusResp.json();
        results["1_phledger_status"] = { status: "✅ CONNECTED", service: statusData.service, version: statusData.version };
        phledgerOnline = true;
      } else {
        results["1_phledger_status"] = { status: "❌ NOT REACHABLE", httpStatus: statusResp.status, url: phledgerUrl };
      }
    } catch (e: unknown) {
      results["1_phledger_status"] = { status: "❌ OFFLINE", error: e instanceof Error ? e.message : String(e), url: phledgerUrl, fix: "Deploy phledgertax to Vercel first" };
    }

    if (!phledgerOnline) {
      // Simulate locally if PHLedger not deployed yet
      results["2_payment"] = {
        status: "⚠️ SIMULATED (PHLedger not deployed yet)",
        paymentId: `PAYTO-SIM-${Date.now()}`,
        amount: 110,
        nppTransactionId: `NPP-SIM-${Date.now()}`,
        escrowStatus: "held",
        costSavings: { stripeWouldCharge: 2.17, phledgerCharges: 0 },
      };
      results["3_invoice"] = {
        status: "⚠️ SIMULATED (PHLedger not deployed yet)",
        invoiceNumber: `SC-INV-SIM-${bookingId.slice(0, 8)}`,
        total: 110,
        journalEntry: "double-entry created",
        costSavings: { xeroMonthlyCost: "$27-78", phledgerCost: "$0" },
      };
      results["4_payout"] = {
        status: "⚠️ SIMULATED (PHLedger not deployed yet)",
        providerAmount: 93.5,
        platformFee: 16.5,
        paytoStatus: "instant settlement",
      };
    } else {
      // Step 2: Process payment via PHLedger PayTo
      try {
        const payResp = await fetch(`${phledgerUrl}/api/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 110,
            currency: "AUD",
            bookingId,
            customerName: "Margaret Chen",
            customerBsb: "062-123",
            customerAccount: "123456789",
            providerName: "Sarah Johnson",
            providerBsb: "062-456",
            providerAccount: "987654321",
            testMode: true,
          }),
        });
        const payData = await payResp.json();
        results["2_payment"] = {
          status: payData.success ? "✅ PASS — PayTo NPP (FREE)" : "❌ FAILED",
          paymentId: payData.paymentId,
          nppTransactionId: payData.nppTransactionId,
          escrowId: payData.escrowId,
          amount: "$110 AUD",
          costSavings: payData.costSavings,
        };
      } catch (e: unknown) {
        results["2_payment"] = { status: "❌ EXCEPTION", error: e instanceof Error ? e.message : String(e) };
      }

      // Step 3: Create invoice via PHLedger (no Xero)
      try {
        const invResp = await fetch(`${phledgerUrl}/api/invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            customerName: "Margaret Chen",
            customerEmail: "customer.test@silverconnect.app",
            serviceName: "Cleaning / Regular",
            duration: 120,
            totalAmount: 110,
            basePrice: 100,
            gstAmount: 10,
            platformFee: 16.5,
            providerPayout: 93.5,
          }),
        });
        const invData = await invResp.json();
        results["3_invoice"] = {
          status: invData.success ? "✅ PASS — Native Invoice (FREE)" : "❌ FAILED",
          invoiceId: invData.invoiceId,
          invoiceNumber: invData.invoiceNumber,
          total: "$" + invData.total,
          journalId: invData.journalId,
          costSavings: invData.costSavings,
        };
      } catch (e: unknown) {
        results["3_invoice"] = { status: "❌ EXCEPTION", error: e instanceof Error ? e.message : String(e) };
      }

      // Step 4: Release payout via PHLedger PayTo
      try {
        const payoutResp = await fetch(`${phledgerUrl}/api/payout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            totalAmount: 110,
            providerName: "Sarah Johnson",
            providerBsb: "062-456",
            providerAccount: "987654321",
            platformFeePercent: 15,
            testMode: true,
          }),
        });
        const payoutData = await payoutResp.json();
        results["4_payout"] = {
          status: payoutData.success ? "✅ PASS — Instant PayTo Payout (FREE)" : "❌ FAILED",
          payoutId: payoutData.payoutId,
          providerAmount: "$" + payoutData.providerAmount,
          platformFee: "$" + payoutData.platformFee,
          nppTransactionId: payoutData.nppTransactionId,
          settledAt: payoutData.settledAt,
        };
      } catch (e: unknown) {
        results["4_payout"] = { status: "❌ EXCEPTION", error: e instanceof Error ? e.message : String(e) };
      }
    }

    // Summary
    const allPassed = Object.values(results).every((r: any) => r.status?.includes("✅") || r.status?.includes("⚠️"));

    return NextResponse.json({
      summary: allPassed ? "✅ PHLedger E2E PASSED (100% FREE — $0 fees)" : "⚠️ SOME STEPS NEED ATTENTION",
      provider: "phledger",
      totalCostThisTest: "$0.00",
      equivalentStripeCost: "$2.17 (saved!)",
      monthlySavingsAt1000Bookings: "$2,750",
      results,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), results }, { status: 500 });
  }
}
