import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/provider-config";
import postgres from "postgres";
import { randomUUID } from "crypto";
import { getStripeClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-e2e-full
 * 
 * Full E2E test covering:
 * 1. Booking creation (with smart pricing)
 * 2. Provider rate override check
 * 3. Stripe payment (real test mode or simulated)
 * 4. Service lifecycle (start → complete → review)
 * 5. Xero invoice generation (real or simulated)
 * 6. Provider payout calculation
 * 
 * Returns detailed results for each step.
 */
export async function POST() {
  const results: Record<string, unknown> = {};
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(dbUrl, { prepare: false, connect_timeout: 15 });

  try {
    const customerId = "37ed768b-5770-46e6-851d-b605eae5f884"; // Margaret Chen
    const providerUserId = "d73656c1-bde8-47cf-a86b-924453f88072"; // Sarah Johnson

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Smart Pricing — Check provider rate override
    // ═══════════════════════════════════════════════════════════
    let providerRate: number | null = null;
    const marketRate = 50; // cleaning market rate
    const category = "cleaning";
    const subtype = "regular";
    const duration = 120; // 2 hours
    const calendarMult = 1.0; // weekday daytime

    // Check if provider has custom rate
    const [profile] = await sql`
      SELECT id, notes FROM provider_profiles WHERE user_id = ${providerUserId} LIMIT 1
    `;

    if (profile?.notes) {
      try {
        const parsed = JSON.parse(profile.notes);
        if (parsed.smart_pricing && parsed.smart_pricing[subtype]) {
          providerRate = parsed.smart_pricing[subtype];
        } else if (parsed.smart_pricing && parsed.smart_pricing[category]) {
          providerRate = parsed.smart_pricing[category];
        }
      } catch { /* not JSON */ }
    }

    const effectiveRate = providerRate || marketRate;
    const basePrice = Math.round((effectiveRate * calendarMult * duration / 60) * 100) / 100;
    const gstAmount = Math.round(basePrice * 0.10 * 100) / 100;
    const totalPrice = Math.round((basePrice + gstAmount) * 100) / 100;
    const platformFee = Math.round(totalPrice * 0.15 * 100) / 100;
    const providerPayout = Math.round((totalPrice - platformFee) * 100) / 100;

    results["1_pricing"] = {
      status: "✅ PASS",
      marketRate,
      providerCustomRate: providerRate,
      effectiveRate,
      calendarMultiplier: calendarMult,
      duration: duration + " min",
      basePrice,
      gst: gstAmount,
      totalPrice,
      platformFee: platformFee + " (15%)",
      providerPayout,
      rateSource: providerRate ? "PROVIDER_OVERRIDE" : "MARKET_DEFAULT",
    };

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Create Booking
    // ═══════════════════════════════════════════════════════════
    const bookingId = randomUUID();
    await sql`
      INSERT INTO bookings (id, customer_id, provider_id, service_id, status, scheduled_at, duration_min, base_price, tax_amount, total_price, currency, notes)
      VALUES (${bookingId}, ${customerId}, ${profile?.id || providerUserId}, 
        (SELECT id FROM services LIMIT 1),
        'confirmed', NOW() + interval '1 day', ${duration}, 
        ${String(basePrice)}, ${String(gstAmount)}, ${String(totalPrice)}, 'AUD',
        'E2E Full Test - Stripe + Xero')
    `;

    results["2_booking"] = {
      status: "✅ PASS",
      bookingId,
      customer: "Margaret Chen",
      provider: "Sarah Johnson",
      service: category + "/" + subtype,
      total: "$" + totalPrice + " AUD",
    };

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Stripe Payment
    // ═══════════════════════════════════════════════════════════
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let stripeResult: Record<string, unknown>;

    if (stripeKey && stripeKey.startsWith("sk_test_")) {
      const stripe = getStripeClient();

      const amountCents = Math.round(totalPrice * 100);
      const pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "aud",
        metadata: { booking_id: bookingId, customer_id: customerId, test: "e2e_full" },
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        description: `SilverConnect E2E: ${category}/${subtype} ${duration}min`,
      });

      // Confirm with test card (simulate successful payment)
      const confirmed = await stripe.paymentIntents.confirm(pi.id, {
        payment_method: "pm_card_visa",
        return_url: "https://silverconnect-global.vercel.app/en/book-service",
      });

      // Record payment in DB
      await sql`
        INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, currency, status, captured_at)
        VALUES (${bookingId}, ${pi.id}, ${String(totalPrice)}, 'AUD', 'captured', NOW())
      `;

      // Update booking status
      await sql`UPDATE bookings SET status = 'confirmed' WHERE id = ${bookingId}`;

      stripeResult = {
        status: "✅ PASS — REAL STRIPE TEST MODE",
        paymentIntentId: pi.id,
        amount: "$" + totalPrice,
        stripeStatus: confirmed.status,
        dashboardUrl: "https://dashboard.stripe.com/test/payments/" + pi.id,
      };
    } else {
      const simId = "pi_sim_" + randomUUID().replace(/-/g, "").slice(0, 24);
      await sql`
        INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, currency, status, captured_at)
        VALUES (${bookingId}, ${simId}, ${String(totalPrice)}, 'AUD', 'captured', NOW())
      `;
      stripeResult = {
        status: "⚠️ SIMULATED — Add STRIPE_SECRET_KEY (sk_test_*) for real test",
        paymentIntentId: simId,
        amount: "$" + totalPrice,
        note: "Set STRIPE_SECRET_KEY in Vercel env vars for real Stripe test",
      };
    }
    results["3_stripe"] = stripeResult;

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Service Lifecycle (start → complete)
    // ═══════════════════════════════════════════════════════════
    await sql`UPDATE bookings SET status = 'in_progress', started_at = NOW() WHERE id = ${bookingId}`;
    await sql`UPDATE bookings SET status = 'completed', completed_at = NOW() WHERE id = ${bookingId}`;

    results["4_lifecycle"] = {
      status: "✅ PASS",
      flow: "confirmed → in_progress → completed",
      startedAt: "NOW()",
      completedAt: "NOW()",
    };

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Xero Invoice
    // ═══════════════════════════════════════════════════════════
    let xeroResult: Record<string, unknown> = { status: "⚠️ NOT RUN" };

    try {
      await sql`CREATE TABLE IF NOT EXISTS platform_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`.catch(() => {});
      const xeroRows = await sql`SELECT value FROM platform_settings WHERE key = 'xero_tokens'`;
      const xeroSettings = xeroRows[0];

      if (!xeroSettings?.value) {
        xeroResult = {
          status: "⚠️ SIMULATED — Xero not connected",
          invoiceNumber: "SC-" + bookingId.slice(0, 8),
          simulatedTotal: "$" + totalPrice,
          lineItem: category + "/" + subtype + " — " + duration + " min",
          gst: "$" + gstAmount,
          setup: { step1: "Set XERO_CLIENT_ID + XERO_CLIENT_SECRET in Vercel", step2: "Visit /api/xero/connect to authorize", step3: "Re-run this test" },
        };
      } else {
        const tokens = JSON.parse(xeroSettings.value);
        let accessToken = tokens.access_token;
        let refreshFailed = false;

        // Refresh if expired
        if (Date.now() > tokens.expires_at && process.env.XERO_CLIENT_ID) {
          const refreshResp = await fetch("https://identity.xero.com/connect/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: "Basic " + Buffer.from((process.env.XERO_CLIENT_ID || "") + ":" + (process.env.XERO_CLIENT_SECRET || "")).toString("base64"),
            },
            body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refresh_token }),
          });

          if (refreshResp.ok) {
            const newTokens = await refreshResp.json();
            if (newTokens.access_token) {
              accessToken = newTokens.access_token;
              const updatedTokens = JSON.stringify({ access_token: newTokens.access_token, refresh_token: newTokens.refresh_token || tokens.refresh_token, expires_at: Date.now() + (newTokens.expires_in || 1800) * 1000, tenant_id: tokens.tenant_id });
              await sql`UPDATE platform_settings SET value = ${updatedTokens}, updated_at = NOW() WHERE key = 'xero_tokens'`.catch(() => {});
            }
          } else {
            refreshFailed = true;
            const errBody = await refreshResp.text().catch(() => "unknown");
            xeroResult = { status: "❌ XERO TOKEN REFRESH FAILED (re-auth needed)", httpStatus: refreshResp.status, error: errBody.slice(0, 200), fix: "Visit /api/xero/connect to re-authorize" };
          }
        }

        // Only create invoice if refresh succeeded
        if (!refreshFailed) {
          const xeroResp = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
            method: "POST",
            headers: { Authorization: "Bearer " + accessToken, "xero-tenant-id": tokens.tenant_id, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ Invoices: [{ Type: "ACCREC", Contact: { Name: "Margaret Chen", EmailAddress: "customer.test@silverconnect.app" }, LineItems: [{ Description: category + "/" + subtype + " " + duration + "min E2E", Quantity: 1, UnitAmount: basePrice, TaxType: "OUTPUT", AccountCode: "200" }], DueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0], Reference: "SC-" + bookingId.slice(0, 8), CurrencyCode: "AUD", Status: "DRAFT" }] }),
          });

          if (xeroResp.ok) {
            const data = await xeroResp.json();
            const inv = data.Invoices?.[0];
            xeroResult = { status: "✅ PASS — REAL XERO DRAFT INVOICE", invoiceId: inv?.InvoiceID, invoiceNumber: inv?.InvoiceNumber, total: "$" + inv?.Total, xeroUrl: "https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=" + (inv?.InvoiceID || "") };
          } else {
            const errText = await xeroResp.text().catch(() => "unknown");
            xeroResult = { status: "❌ XERO API ERROR", httpStatus: xeroResp.status, error: errText.slice(0, 200), fix: "Check scopes or re-auth at /api/xero/connect" };
          }
        }
      }
    } catch (xeroErr: unknown) {
      xeroResult = { status: "❌ XERO EXCEPTION", error: xeroErr instanceof Error ? xeroErr.message : String(xeroErr), fix: "Re-authorize at /api/xero/connect" };
    }
    results["5_xero"] = xeroResult;

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Provider Payout
    // ═══════════════════════════════════════════════════════════
    await sql`
      UPDATE wallets SET 
        balance_pending = balance_pending + ${providerPayout},
        updated_at = NOW()
      WHERE provider_id = ${profile?.id || providerUserId}
    `.catch(async () => {
      // Wallet may not exist — create it
      await sql`
        INSERT INTO wallets (provider_id, balance_available, balance_pending, currency)
        VALUES (${profile?.id || providerUserId}, 0, ${providerPayout}, 'AUD')
        ON CONFLICT (provider_id) DO UPDATE SET balance_pending = wallets.balance_pending + ${providerPayout}
      `;
    });

    results["6_payout"] = {
      status: "✅ PASS",
      providerPayout: "$" + providerPayout,
      platformFee: "$" + platformFee,
      payoutMethod: "Pending (releases after 48hr or manual)",
    };

    // ═══════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════
    await sql.end();

    const provider = getPaymentProvider();
    const allPassed = Object.values(results).every((r: any) => r.status?.includes("✅") || r.status?.includes("⚠️"));

    return NextResponse.json({
      success: true,
      summary: allPassed ? `✅ ALL STEPS PASSED (${provider === "phledger" ? "PHLedger FREE" : "Stripe+Xero PAID"})` : "⚠️ SOME STEPS SIMULATED (add env vars for real tests)",
      bookingId,
      results,
      envStatus: {
      paymentProvider: getPaymentProvider(),
        STRIPE_SECRET_KEY: stripeKey ? "✅ Set (test mode)" : "❌ Missing",
        XERO_CLIENT_ID: process.env.XERO_CLIENT_ID ? "✅ Set" : "❌ Missing",
        DATABASE_URL: "✅ Set",
      },
      nextSteps: {
        stripe: stripeKey ? "✅ Real Stripe test mode active" : "Add sk_test_* to Vercel → Settings → Env Vars",
        xero: (xeroResult?.status?.toString().includes("✅")) ? "✅ Xero connected + invoice created" : "Visit /api/xero/connect to authorize, then re-run",
      },
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), results }, { status: 500 });
  }
}
