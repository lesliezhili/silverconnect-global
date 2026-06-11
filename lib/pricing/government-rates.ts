/**
 * Government-capped hourly rates by scheme and service category.
 * Platform rates MUST be BELOW these caps to remain competitive
 * and sustainable (non-profit 15% margin).
 *
 * NDIS Price Guide 2025-26:
 * https://www.ndis.gov.au/providers/pricing-arrangements
 *
 * TAC Fee Schedule:
 * https://www.tac.vic.gov.au/providers/fees-and-service-approvals
 *
 * WorkSafe Victoria Fee Schedule:
 * https://www.worksafe.vic.gov.au/fee-schedules
 *
 * RULE: Platform rate < Government rate (ensures sustainability + competitiveness)
 * Our providers earn MORE than other platforms (85% of our lower rate > 60-75% of higher agency rate)
 */

export type ServiceCategory =
  | "cleaning"
  | "garden"
  | "repair"
  | "personalCare"
  | "companion"
  | "transport"
  | "itSupport";

export type FundingScheme = "ndis" | "tac" | "worksafe" | "dva" | "my_aged_care" | "hcp" | "aged_pension" | "super";

/**
 * Maximum hourly rates (AUD) per scheme per service category.
 * Platform rate MUST NOT exceed these — validation enforced at form + API level.
 */
export const GOVERNMENT_RATE_CAPS: Record<FundingScheme, Record<ServiceCategory, number>> = {
  ndis: {
    cleaning: 67.56,       // Assistance with household tasks (weekday)
    garden: 67.56,         // Assistance with household tasks
    repair: 67.56,         // Home maintenance
    personalCare: 74.45,   // Assistance with daily personal activities
    companion: 67.56,      // Community participation
    transport: 67.56,      // Transport (per hour, excludes km)
    itSupport: 67.56,      // Skill building / capacity building
  },
  tac: {
    cleaning: 65.00,
    garden: 65.00,
    repair: 70.00,
    personalCare: 72.00,
    companion: 60.00,
    transport: 60.00,
    itSupport: 65.00,
  },
  worksafe: {
    cleaning: 62.00,
    garden: 62.00,
    repair: 68.00,
    personalCare: 70.00,
    companion: 58.00,
    transport: 58.00,
    itSupport: 62.00,
  },
  dva: {
    cleaning: 60.00,
    garden: 60.00,
    repair: 65.00,
    personalCare: 68.50,
    companion: 55.00,
    transport: 55.00,
    itSupport: 60.00,
  },
  my_aged_care: {
    cleaning: 58.00,
    garden: 58.00,
    repair: 63.00,
    personalCare: 65.00,
    companion: 52.00,
    transport: 52.00,
    itSupport: 58.00,
  },
  hcp: {
    cleaning: 58.00,
    garden: 58.00,
    repair: 63.00,
    personalCare: 65.00,
    companion: 52.00,
    transport: 52.00,
    itSupport: 58.00,
  },
  aged_pension: {
    // Centrelink Commonwealth Home Support Programme (CHSP) rates
    cleaning: 55.00,
    garden: 55.00,
    repair: 58.00,
    personalCare: 60.00,
    companion: 48.00,
    transport: 48.00,
    itSupport: 55.00,
  },
  super: {
    // Self-funded retiree (superannuation drawdown) — no government cap
    // but platform recommends below NDIS rates for consistency
    cleaning: 67.56,
    garden: 67.56,
    repair: 67.56,
    personalCare: 74.45,
    companion: 67.56,
    transport: 67.56,
    itSupport: 67.56,
  },
};

/**
 * Platform recommended rates (below government cap, above industry floor).
 * Provider earns 85% of this rate. Must stay below government cap.
 *
 * Formula: Platform rate = Government rate × 0.80 (20% below cap)
 * Provider receives: Platform rate × 0.85 = Government rate × 0.68
 * Still 31-49% above NDIS floor rates due to zero-agency overhead.
 */
export const PLATFORM_RECOMMENDED_RATES: Record<ServiceCategory, number> = {
  cleaning: 52.00,
  garden: 52.00,
  repair: 55.00,
  personalCare: 58.00,
  companion: 48.00,
  transport: 48.00,
  itSupport: 52.00,
};

/**
 * Validate that a provider's hourly rate does not exceed the government cap.
 * Returns { valid, maxRate, message } for UI display.
 */
export function validateRateAgainstCap(
  rate: number,
  scheme: FundingScheme,
  category: ServiceCategory
): { valid: boolean; maxRate: number; message: string } {
  const cap = GOVERNMENT_RATE_CAPS[scheme]?.[category];
  if (!cap) {
    return { valid: true, maxRate: 999, message: "" };
  }

  if (rate > cap) {
    return {
      valid: false,
      maxRate: cap,
      message: `Rate must be below ${scheme.toUpperCase()} cap of $${cap.toFixed(2)}/hr`,
    };
  }

  if (rate > cap * 0.95) {
    return {
      valid: true,
      maxRate: cap,
      message: `Close to ${scheme.toUpperCase()} cap ($${cap.toFixed(2)}/hr). Recommend ≤$${(cap * 0.80).toFixed(2)}/hr for competitiveness.`,
    };
  }

  return { valid: true, maxRate: cap, message: "" };
}
