/**
 * SilverConnect Global — Finance Agent
 * 
 * Responsible for:
 * - Bookkeeping: automated transaction ledger, revenue recognition
 * - Accounting: P&L, balance sheet generation, tax reporting
 * - Forecasting: revenue/demand prediction using historical patterns
 * - Budgeting: provider payout budgets, marketing spend allocation
 * - Financial compliance: GST/VAT reporting per jurisdiction
 * 
 * Deployable as: standalone financial microservice
 * Dependencies: PostgreSQL, ML model (Prophet/ARIMA for forecasting)
 * 
 * Architecture:
 * ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
 * │  Bookkeeping    │───▶│   Accounting     │───▶│   Reporting      │
 * │  (Ledger)       │    │   (P&L, BS)      │    │   (Tax, Audit)   │
 * └─────────────────┘    └──────────────────┘    └──────────────────┘
 *         │                        │
 *         ▼                        ▼
 * ┌─────────────────┐    ┌──────────────────┐
 * │  Forecasting    │    │   Budgeting      │
 * │  (ML Predict)   │    │   (Allocation)   │
 * └─────────────────┘    └──────────────────┘
 */

export interface FinanceAgentConfig {
  dbUrl: string;
  baseCurrency: string;
  fiscalYearStart: number; // month (1-12), e.g., 7 for July (AU fiscal year)
  taxJurisdictions: string[];
  forecastHorizonMonths: number;
  reconciliationFrequency: "daily" | "weekly" | "monthly";
}

export const DEFAULT_FINANCE_CONFIG: FinanceAgentConfig = {
  dbUrl: process.env.DATABASE_URL || "",
  baseCurrency: "AUD",
  fiscalYearStart: 7, // Australian fiscal year starts July
  taxJurisdictions: ["AU", "CN", "CA", "US", "TW", "SG", "HK", "MY"],
  forecastHorizonMonths: 12,
  reconciliationFrequency: "daily",
};

/** Ledger entry (double-entry bookkeeping) */
export interface LedgerEntry {
  id: string;
  date: Date;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  reference: string; // booking_id or payout_id
  category: "revenue" | "payout" | "fee" | "refund" | "tax" | "expense";
}

/** Chart of Accounts for SilverConnect */
export const CHART_OF_ACCOUNTS = {
  // Assets
  "1000": { name: "Cash at Bank", type: "asset" },
  "1100": { name: "Accounts Receivable", type: "asset" },
  "1200": { name: "Escrow Holdings", type: "asset" },
  // Liabilities
  "2000": { name: "Accounts Payable (Providers)", type: "liability" },
  "2100": { name: "GST/VAT Payable", type: "liability" },
  "2200": { name: "Unearned Revenue (Prepaid)", type: "liability" },
  // Revenue
  "4000": { name: "Platform Fee Revenue", type: "revenue" },
  "4100": { name: "Service Charge Revenue", type: "revenue" },
  "4200": { name: "Tool Fee Margin", type: "revenue" },
  // Expenses
  "5000": { name: "Payment Processing Fees", type: "expense" },
  "5100": { name: "Provider Payouts", type: "expense" },
  "5200": { name: "Refunds Issued", type: "expense" },
  "5300": { name: "Insurance Coverage", type: "expense" },
  "5400": { name: "Marketing & Acquisition", type: "expense" },
} as const;

/** Revenue forecast model */
export interface RevenueForecast {
  period: string; // YYYY-MM
  predictedRevenue: number;
  confidenceLow: number;
  confidenceHigh: number;
  growthRate: number;
  seasonalityFactor: number;
  assumptions: string[];
}

/** Budget allocation */
export interface BudgetAllocation {
  period: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationRate: number;
}

/** Tax report per jurisdiction */
export interface TaxReport {
  jurisdiction: string;
  period: string;
  grossRevenue: number;
  taxableAmount: number;
  taxRate: number;
  taxOwed: number;
  taxCollected: number;
  netPosition: number; // collected - owed
}

export const FINANCE_AGENT_CAPABILITIES = [
  "ledger_entry",           // Record financial transactions
  "revenue_recognition",    // Recognize revenue per AASB 15/IFRS 15
  "pnl_generation",         // Generate P&L statement
  "balance_sheet",          // Generate balance sheet
  "cash_flow",             // Cash flow statement
  "tax_reporting",          // Per-jurisdiction GST/VAT reports
  "revenue_forecast",       // ML-based revenue prediction
  "demand_forecast",        // Predict booking demand
  "budget_allocation",      // Allocate budgets by category
  "budget_tracking",        // Track spend vs budget
  "reconciliation",         // Match payments to bookings
  "provider_payout_calc",   // Calculate provider earnings
  "financial_alerts",       // Unusual activity detection
  "audit_trail",           // Immutable financial audit log
] as const;

export type FinanceCapability = typeof FINANCE_AGENT_CAPABILITIES[number];
