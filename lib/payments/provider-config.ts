/**
 * Payment Provider Switch
 * 
 * PHLedger is FREE exclusively for PHLedger company and SilverConnect.
 * All other platforms require a commercial license.
 *
 * Controls whether SilverConnect uses:
 *   - "stripe_xero" = Stripe (payments) + Xero (invoicing) — PAID services
 *   - "phledger"    = PHLedger PayTo + Native Invoicing — FREE open-source
 * 
 * Set via environment variable PAYMENT_PROVIDER or platform_settings DB
 * Default: "stripe_xero" (backwards compatible)
 */

export type PaymentProvider = "stripe_xero" | "phledger";

export function getPaymentProvider(): PaymentProvider {
  const env = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (env === "phledger" || env === "phledgertax") return "phledger";
  return "stripe_xero";
}

export const PHLEDGER_API_URL = process.env.PHLEDGER_API_URL || "https://phledgertax.vercel.app";

export interface PaymentResult {
  success: boolean;
  provider: PaymentProvider;
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  dashboardUrl?: string;
  // PHLedger specific
  nppTransactionId?: string;
  escrowId?: string;
  costSavings?: { stripeWouldCharge: number; phledgerCharges: number };
}

export interface InvoiceResult {
  success: boolean;
  provider: PaymentProvider;
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  status: string;
  viewUrl?: string;
  // PHLedger specific
  journalId?: string;
  costSavings?: { xeroMonthlyCost: string; phledgerCost: string };
}

export interface PayoutResult {
  success: boolean;
  provider: PaymentProvider;
  payoutId: string;
  providerAmount: number;
  platformFee: number;
  status: string;
  settledAt?: string;
}
