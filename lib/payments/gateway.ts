/**
 * Unified Payment Gateway
 * 
 * Single interface that routes to either Stripe+Xero or PHLedger
 * based on the PAYMENT_PROVIDER environment variable.
 * 
 * Usage:
 *   import { processPayment, createInvoice, releasePayout } from "@/lib/payments/gateway";
 *   const result = await processPayment({ amount: 110, bookingId: "..." });
 *   // Automatically uses configured provider
 */

import { getPaymentProvider, PHLEDGER_API_URL, PaymentResult, InvoiceResult, PayoutResult } from "./provider-config";

interface PaymentInput {
  amount: number;
  currency?: string;
  bookingId: string;
  customerName: string;
  customerEmail?: string;
  // For PHLedger PayTo
  customerBsb?: string;
  customerAccount?: string;
  // Provider info (for escrow)
  providerName?: string;
  providerBsb?: string;
  providerAccount?: string;
}

interface InvoiceInput {
  bookingId: string;
  customerName: string;
  customerEmail?: string;
  serviceName: string;
  duration: number;
  totalAmount: number;
  basePrice: number;
  gstAmount: number;
  platformFee?: number;
  providerPayout?: number;
}

interface PayoutInput {
  bookingId: string;
  totalAmount: number;
  providerName: string;
  providerBsb?: string;
  providerAccount?: string;
  platformFeePercent?: number;
}

// ════════════════════════════════════════════════════════════
// PAYMENT (replaces Stripe PaymentIntent)
// ════════════════════════════════════════════════════════════

export async function processPayment(input: PaymentInput): Promise<PaymentResult> {
  const provider = getPaymentProvider();

  if (provider === "phledger") {
    return processPaymentPHLedger(input);
  }
  return processPaymentStripe(input);
}

async function processPaymentStripe(input: PaymentInput): Promise<PaymentResult> {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" as any });

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(input.amount * 100), // cents
    currency: input.currency || "aud",
    metadata: { bookingId: input.bookingId, customer: input.customerName },
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });

  // Confirm with test card in test mode
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    await stripe.paymentIntents.confirm(pi.id, {
      payment_method: "pm_card_visa",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app"}/en/book-service`,
    });
  }

  const confirmed = await stripe.paymentIntents.retrieve(pi.id);

  return {
    success: confirmed.status === "succeeded",
    provider: "stripe_xero",
    paymentId: pi.id,
    status: confirmed.status,
    amount: input.amount,
    currency: input.currency || "aud",
    dashboardUrl: `https://dashboard.stripe.com/test/payments/${pi.id}`,
  };
}

async function processPaymentPHLedger(input: PaymentInput): Promise<PaymentResult> {
  const resp = await fetch(`${PHLEDGER_API_URL}/api/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency || "AUD",
      bookingId: input.bookingId,
      customerName: input.customerName,
      customerBsb: input.customerBsb || "062-000",
      customerAccount: input.customerAccount || "000000000",
      providerName: input.providerName || "",
      providerBsb: input.providerBsb || "062-000",
      providerAccount: input.providerAccount || "000000000",
      testMode: true,
    }),
  });
  const data = await resp.json();

  return {
    success: data.success,
    provider: "phledger",
    paymentId: data.paymentId,
    status: data.status,
    amount: input.amount,
    currency: input.currency || "aud",
    nppTransactionId: data.nppTransactionId,
    escrowId: data.escrowId,
    costSavings: data.costSavings,
  };
}

// ════════════════════════════════════════════════════════════
// INVOICING (replaces Xero)
// ════════════════════════════════════════════════════════════

export async function createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
  const provider = getPaymentProvider();

  if (provider === "phledger") {
    return createInvoicePHLedger(input);
  }
  return createInvoiceXero(input);
}

async function createInvoiceXero(input: InvoiceInput): Promise<InvoiceResult> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  // Get Xero tokens from DB
  const [stored] = await sql`SELECT value FROM platform_settings WHERE key = 'xero_tokens'`;
  if (!stored?.value) {
    await sql.end();
    return { success: false, provider: "stripe_xero", invoiceId: "", invoiceNumber: "", total: 0, status: "not_connected", viewUrl: "" };
  }

  const tokens = JSON.parse(stored.value);
  let accessToken = tokens.access_token;

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
        const updated = JSON.stringify({ access_token: newTokens.access_token, refresh_token: newTokens.refresh_token || tokens.refresh_token, expires_at: Date.now() + (newTokens.expires_in || 1800) * 1000, tenant_id: tokens.tenant_id });
        await sql`UPDATE platform_settings SET value = ${updated}, updated_at = NOW() WHERE key = 'xero_tokens'`.catch(() => {});
      }
    }
  }

  const xeroResp = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken, "xero-tenant-id": tokens.tenant_id, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ Invoices: [{ Type: "ACCREC", Contact: { Name: input.customerName, EmailAddress: input.customerEmail || "" }, LineItems: [{ Description: input.serviceName + " — " + input.duration + " min", Quantity: 1, UnitAmount: input.basePrice, TaxType: "OUTPUT", AccountCode: "200" }], DueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0], Reference: "SC-" + input.bookingId.slice(0, 8), CurrencyCode: "AUD", Status: "DRAFT" }] }),
  });

  await sql.end();

  if (xeroResp.ok) {
    const data = await xeroResp.json();
    const inv = data.Invoices?.[0];
    return {
      success: true, provider: "stripe_xero",
      invoiceId: inv?.InvoiceID || "", invoiceNumber: inv?.InvoiceNumber || "",
      total: inv?.Total || 0, status: inv?.Status || "DRAFT",
      viewUrl: `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${inv?.InvoiceID}`,
    };
  }
  return { success: false, provider: "stripe_xero", invoiceId: "", invoiceNumber: "", total: 0, status: "error" };
}

async function createInvoicePHLedger(input: InvoiceInput): Promise<InvoiceResult> {
  const resp = await fetch(`${PHLEDGER_API_URL}/api/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId: input.bookingId,
      customerName: input.customerName,
      customerEmail: input.customerEmail || "",
      serviceName: input.serviceName,
      duration: input.duration,
      totalAmount: input.totalAmount,
      basePrice: input.basePrice,
      gstAmount: input.gstAmount,
      platformFee: input.platformFee,
      providerPayout: input.providerPayout,
    }),
  });
  const data = await resp.json();

  return {
    success: data.success,
    provider: "phledger",
    invoiceId: data.invoiceId || "",
    invoiceNumber: data.invoiceNumber || "",
    total: data.total || 0,
    status: data.status || "draft",
    viewUrl: data.viewUrl,
    journalId: data.journalId,
    costSavings: { xeroMonthlyCost: "$27-78/month", phledgerCost: "$0 (open-source)" },
  };
}

// ════════════════════════════════════════════════════════════
// PAYOUT (replaces Stripe Connect)
// ════════════════════════════════════════════════════════════

export async function releasePayout(input: PayoutInput): Promise<PayoutResult> {
  const provider = getPaymentProvider();

  if (provider === "phledger") {
    return releasePayoutPHLedger(input);
  }
  return releasePayoutInternal(input);
}

async function releasePayoutInternal(input: PayoutInput): Promise<PayoutResult> {
  // Current Stripe mode: payout is tracked in wallet (no real Stripe Connect transfer yet)
  const feePercent = input.platformFeePercent || 15;
  const platformFee = Math.round(input.totalAmount * (feePercent / 100) * 100) / 100;
  const providerAmount = Math.round((input.totalAmount - platformFee) * 100) / 100;

  return {
    success: true, provider: "stripe_xero",
    payoutId: `WALLET-${Date.now()}`,
    providerAmount, platformFee,
    status: "completed",
  };
}

async function releasePayoutPHLedger(input: PayoutInput): Promise<PayoutResult> {
  const resp = await fetch(`${PHLEDGER_API_URL}/api/payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId: input.bookingId,
      totalAmount: input.totalAmount,
      providerName: input.providerName,
      providerBsb: input.providerBsb || "062-000",
      providerAccount: input.providerAccount || "000000000",
      platformFeePercent: input.platformFeePercent || 15,
      testMode: true,
    }),
  });
  const data = await resp.json();

  return {
    success: data.success,
    provider: "phledger",
    payoutId: data.payoutId || "",
    providerAmount: data.providerAmount || 0,
    platformFee: data.platformFee || 0,
    status: data.status || "settled",
    settledAt: data.settledAt,
  };
}
