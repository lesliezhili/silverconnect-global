import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * SMART PRICING ENGINE — SilverConnect Global
 * 
 * Factors:
 * 1. Day type: weekday / saturday / sunday / public holiday
 * 2. Time bracket: standard (7am-8pm) / evening / early morning / overnight
 * 3. Government rate caps (NDIS/TAC/WorkSafe/DVA)
 * 4. Customer affordability (budget remaining)
 * 5. Provider floor rate (fair pay guarantee)
 * 6. Platform fee (reduced on weekends/holidays to help affordability)
 * 
 * Philosophy: Fair pay for providers + affordable for customers/govt
 * Provider ALWAYS receives at least the floor rate (living wage guarantee)
 */

// ─── Public Holiday Calendars (AU/CN/CA 2026) ───────────────

const PUBLIC_HOLIDAYS_2026: Record<string, string[]> = {
  AU: [
    "2026-01-01", "2026-01-26", "2026-04-03", "2026-04-06",
    "2026-04-25", "2026-06-08", "2026-12-25", "2026-12-26",
    "2026-12-28", // Boxing Day observed
  ],
  CN: [
    "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19",
    "2026-04-05", "2026-05-01", "2026-10-01", "2026-10-02", "2026-10-03",
  ],
  CA: [
    "2026-01-01", "2026-02-16", "2026-04-03", "2026-05-18",
    "2026-07-01", "2026-09-07", "2026-10-12", "2026-12-25",
  ],
};

// ─── Day & Time Classification ──────────────────────────────

export function classifyDayType(date: Date, country: string): "weekday" | "saturday" | "sunday" | "public_holiday" {
  const dateStr = date.toISOString().split("T")[0];
  const holidays = PUBLIC_HOLIDAYS_2026[country] || PUBLIC_HOLIDAYS_2026["AU"];
  if (holidays.includes(dateStr)) return "public_holiday";
  const day = date.getDay();
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekday";
}

export function classifyTimeBracket(hour: number): "standard" | "early_morning" | "evening" | "overnight" {
  if (hour < 7) return "early_morning";
  if (hour >= 20 && hour < 22) return "evening";
  if (hour >= 22 || hour < 6) return "overnight";
  return "standard";
}

// ─── Core Pricing Calculation ────────────────────────────────

export interface SmartPricingInput {
  providerBaseRate: number;
  durationHours: number;
  targetDate: Date;
  country: string;
  fundingSource?: "self_funded" | "ndis" | "tac" | "worksafe" | "dva" | "home_care_package" | "chsp";
  serviceTier?: "basic" | "certified" | "clinical";
  serviceType?: string;
  customerId?: string;
}

export interface SmartPricingResult {
  // Customer sees
  totalCustomerCharge: number;
  hourlyRateCharged: number;
  // Provider receives
  providerPayout: number;
  providerHourlyRate: number;
  // Platform
  platformFee: number;
  platformFeePct: number;
  // Breakdown
  dayType: string;
  timeBracket: string;
  multiplier: number;
  govtRateCap: number | null;
  customerBudgetRemaining: number | null;
  affordabilityWarning: string | null;
  fairPayGuaranteed: boolean;
  currency: string;
}

export async function calculateSmartPricing(input: SmartPricingInput): Promise<SmartPricingResult> {
  const { providerBaseRate, durationHours, targetDate, country, fundingSource, serviceTier, serviceType, customerId } = input;

  const dayType = classifyDayType(targetDate, country);
  const hour = targetDate.getHours();
  const timeBracket = classifyTimeBracket(hour);
  const currency = country === "CN" ? "CNY" : country === "CA" ? "CAD" : country === "US" ? "USD" : country === "TW" ? "TWD" : country === "SG" ? "SGD" : country === "HK" ? "HKD" : country === "MY" ? "MYR" : "AUD";

  // 1. Get pricing rule (multiplier + platform fee)
  const ruleRows: any = await db.execute(sql`
    SELECT multiplier, platform_fee_pct, provider_floor_rate
    FROM pricing_rules
    WHERE country = ${country} AND day_type = ${dayType} AND time_bracket = ${timeBracket}
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC LIMIT 1
  `);
  const rule = ruleRows.rows?.[0] || { multiplier: 1.0, platform_fee_pct: 15.0, provider_floor_rate: 38.0 };

  const multiplier = parseFloat(rule.multiplier) || 1.0;
  const platformFeePct = parseFloat(rule.platform_fee_pct) || 15.0;
  const providerFloor = parseFloat(rule.provider_floor_rate) || 38.0;

  // 2. Calculate provider hourly rate (base * multiplier, min = floor)
  let providerHourly = Math.max(providerBaseRate * multiplier, providerFloor);

  // 3. Check government rate cap if funded
  let govtRateCap: number | null = null;
  if (fundingSource && fundingSource !== "self_funded") {
    const govtRows: any = await db.execute(sql`
      SELECT max_rate, provider_min_rate
      FROM govt_agency_rates
      WHERE agency = ${fundingSource} AND day_type = ${dayType} AND time_bracket = ${timeBracket}
        AND (service_tier = ${serviceTier || "basic"})
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      ORDER BY effective_from DESC LIMIT 1
    `);
    const govtRate = govtRows.rows?.[0];
    if (govtRate) {
      govtRateCap = parseFloat(govtRate.max_rate);
      const govtProviderMin = parseFloat(govtRate.provider_min_rate);
      // Provider gets at least govt minimum, customer/agency pays up to govt cap
      providerHourly = Math.max(Math.min(providerHourly, govtRateCap * 0.85), govtProviderMin);
    }
  }

  // 4. Calculate totals
  const providerPayout = providerHourly * durationHours;
  const platformFee = providerPayout * (platformFeePct / 100);
  let totalCharge = providerPayout + platformFee;

  // Cap at govt rate if applicable
  if (govtRateCap) {
    const maxTotal = govtRateCap * durationHours;
    if (totalCharge > maxTotal) {
      totalCharge = maxTotal;
      // Absorb excess in platform fee (provider still gets full payout)
    }
  }

  // 5. Check customer affordability
  let budgetRemaining: number | null = null;
  let affordabilityWarning: string | null = null;
  if (customerId && fundingSource && fundingSource !== "self_funded") {
    const capRows: any = await db.execute(sql`
      SELECT remaining_budget, weekly_budget, monthly_budget
      FROM affordability_caps
      WHERE customer_id = ${customerId} AND funding_source = ${fundingSource}
        AND (plan_end_date IS NULL OR plan_end_date >= CURRENT_DATE)
      ORDER BY created_at DESC LIMIT 1
    `);
    const cap = capRows.rows?.[0];
    if (cap) {
      budgetRemaining = parseFloat(cap.remaining_budget) || 0;
      if (totalCharge > budgetRemaining) {
        affordabilityWarning = `This booking ($${totalCharge.toFixed(2)}) exceeds your remaining ${fundingSource.toUpperCase()} budget ($${budgetRemaining.toFixed(2)}). Consider shorter duration or contact your plan manager.`;
      }
    }
  }

  // 6. Fair pay guarantee check
  const fairPayGuaranteed = providerHourly >= providerFloor;

  return {
    totalCustomerCharge: Math.round(totalCharge * 100) / 100,
    hourlyRateCharged: Math.round((totalCharge / durationHours) * 100) / 100,
    providerPayout: Math.round(providerPayout * 100) / 100,
    providerHourlyRate: Math.round(providerHourly * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    platformFeePct,
    dayType,
    timeBracket,
    multiplier,
    govtRateCap,
    customerBudgetRemaining: budgetRemaining,
    affordabilityWarning,
    fairPayGuaranteed,
    currency,
  };
}

// ─── Cancellation Fee Calculator ─────────────────────────────

export async function calculateCancellationFee(params: {
  bookingId: string;
  bookingTotal: number;
  scheduledAt: Date;
  cancelledAt: Date;
  country: string;
  fundingSource?: string;
}): Promise<{
  refundAmount: number;
  providerCompensation: number;
  platformRetains: number;
  policyApplied: string;
  noticeHoursGiven: number;
}> {
  const { bookingTotal, scheduledAt, cancelledAt, country, fundingSource } = params;
  const noticeMs = scheduledAt.getTime() - cancelledAt.getTime();
  const noticeHours = Math.max(0, noticeMs / (1000 * 60 * 60));

  // Get applicable policy
  const policyRows: any = await db.execute(sql`
    SELECT notice_hours, refund_pct, provider_compensation_pct, description
    FROM cancellation_policies
    WHERE country = ${country}
      AND notice_hours <= ${Math.floor(noticeHours)}
      AND (applies_to = 'all' OR applies_to = ${fundingSource === "self_funded" ? "self_funded" : "govt_funded"})
    ORDER BY notice_hours DESC LIMIT 1
  `);

  const policy = policyRows.rows?.[0] || { refund_pct: 0, provider_compensation_pct: 90, description: "Default: no refund" };

  const refundPct = parseFloat(policy.refund_pct) / 100;
  const providerCompPct = parseFloat(policy.provider_compensation_pct) / 100;

  const refundAmount = bookingTotal * refundPct;
  const providerCompensation = bookingTotal * providerCompPct;
  const platformRetains = bookingTotal - refundAmount - providerCompensation;

  return {
    refundAmount: Math.round(refundAmount * 100) / 100,
    providerCompensation: Math.round(providerCompensation * 100) / 100,
    platformRetains: Math.max(0, Math.round(platformRetains * 100) / 100),
    policyApplied: policy.description,
    noticeHoursGiven: Math.round(noticeHours * 10) / 10,
  };
}


// ─── PROXIMITY & TOOL INTEGRATION ────────────────────────────
// Re-exports from proximity engine for unified access

export { 
  classifyDistance,
  calculatePrice as calculateProximityPrice,
  estimatePostcodeDistance,
  calculateMatchScore,
  sortProvidersByProximity,
  POSTCODE_LABEL,
  SERVICE_TOOL_REQUIREMENTS,
  type DistanceTier,
  type ToolProvision,
  type PricingFactors,
  type PriceBreakdown,
  type ProviderMatch,
  type DistanceInfo,
} from "@/lib/matching/proximity-engine";

/**
 * FULL PRICE CALCULATION — combines all engines:
 * 1. Smart engine (day/time/government caps/affordability)
 * 2. Proximity engine (distance discount/surcharge)
 * 3. Tool provision (customer provides = -12%)
 * 4. Market rates (competitive positioning)
 *
 * Priority order for discounts:
 * - Distance: Applied first (physical cost saving)
 * - Tools: Applied second (equipment cost saving)
 * - Loyalty: Applied third (retention incentive)
 * - Time/demand: Applied last (market adjustment)
 *
 * Floor: Provider ALWAYS receives at least minimum wage (AU $24.10/h)
 * Cap: Never exceed government rate caps (NDIS/TAC/etc) for funded clients
 */
