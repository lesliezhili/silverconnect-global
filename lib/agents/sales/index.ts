/**
 * SilverConnect Global — Sales & Marketing Agent
 * 
 * Responsible for:
 * - Customer acquisition & onboarding funnels
 * - Referral program management
 * - Promotional campaigns & discount codes
 * - Provider recruitment & onboarding
 * - Market analytics & growth metrics
 * - Customer segmentation
 * - Retention & re-engagement
 * 
 * Deployable as: standalone service, integrates with CRM/email providers
 * Dependencies: PostgreSQL, Email service (Resend/SendGrid), Analytics
 */

export interface SalesAgentConfig {
  dbUrl: string;
  emailProvider: "resend" | "sendgrid" | "ses";
  emailApiKey: string;
  analyticsEnabled: boolean;
  referralRewardAmount: number; // in local currency
  referralRewardCurrency: string;
}

export const DEFAULT_SALES_CONFIG: SalesAgentConfig = {
  dbUrl: process.env.DATABASE_URL || "",
  emailProvider: "resend",
  emailApiKey: process.env.EMAIL_API_KEY || "",
  analyticsEnabled: true,
  referralRewardAmount: 25,
  referralRewardCurrency: "AUD",
};

/** Promo/discount code structure */
export interface PromoCode {
  code: string;
  type: "percentage" | "fixed_amount" | "free_tool_fee";
  value: number;
  maxUses: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories: string[]; // empty = all
  applicableCountries: string[]; // empty = all
  minOrderAmount: number;
}

/** Referral tracking */
export interface Referral {
  referrerId: string;
  refereeId: string;
  referralCode: string;
  status: "pending" | "qualified" | "rewarded" | "expired";
  rewardAmount: number;
  qualifiedAt?: Date;
  rewardedAt?: Date;
}

/** Growth metrics */
export interface GrowthMetrics {
  period: string; // YYYY-MM
  newCustomers: number;
  newProviders: number;
  bookingsCreated: number;
  bookingsCompleted: number;
  revenue: number;
  avgOrderValue: number;
  customerRetentionRate: number;
  providerRetentionRate: number;
  referralConversionRate: number;
}

export const SALES_AGENT_CAPABILITIES = [
  "promo_management",        // Create/validate promo codes
  "referral_tracking",       // Track referral chains
  "customer_segmentation",   // Segment by behavior/value
  "campaign_automation",     // Trigger email campaigns
  "growth_analytics",        // Dashboard metrics
  "provider_recruitment",    // Outreach to potential providers
  "onboarding_funnel",       // Track conversion funnel
  "retention_alerts",        // Churn risk detection
  "market_expansion",        // New geography analysis
] as const;

export type SalesCapability = typeof SALES_AGENT_CAPABILITIES[number];
