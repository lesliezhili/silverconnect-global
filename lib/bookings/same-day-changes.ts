/**
 * Same-Day Booking Change Engine
 * Penalty tiers based on notice period, provider tier requirements, repeat offender tracking
 */

export type ChangeType = 'reschedule' | 'provider_swap' | 'service_change' | 'address_change';
export type ProviderTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ChangeRequest {
  bookingId: string;
  changeType: ChangeType;
  reason?: string;
  newDate?: Date;
  newTime?: string;
  newProviderId?: string;
  newServiceId?: string;
  newAddress?: string;
}

export interface ChangePenalty {
  penaltyPercent: number;
  adminFee: number;
  surgePremium: number;
  minimumProviderTier: ProviderTier;
  noticeBracket: string;
}

export interface ChangeQuote {
  request: ChangeRequest;
  originalAmount: number;
  penaltyAmount: number;
  adminFee: number;
  surgePremium: number;
  providerIncentiveBonus: number;
  repeatOffenderSurcharge: number;
  totalAdditionalCost: number;
  minimumProviderTier: ProviderTier;
  allowed: boolean;
  reason?: string;
}

// Penalty tiers by notice period
const PENALTY_TIERS: { maxHours: number; penalty: ChangePenalty }[] = [
  { maxHours: Infinity, penalty: { penaltyPercent: 0, adminFee: 15, surgePremium: 0, minimumProviderTier: 'bronze', noticeBracket: '>4h' } },
  { maxHours: 4, penalty: { penaltyPercent: 25, adminFee: 15, surgePremium: 0.10, minimumProviderTier: 'silver', noticeBracket: '2-4h' } },
  { maxHours: 2, penalty: { penaltyPercent: 50, adminFee: 25, surgePremium: 0.25, minimumProviderTier: 'gold', noticeBracket: '1-2h' } },
  { maxHours: 1, penalty: { penaltyPercent: 75, adminFee: 35, surgePremium: 0.35, minimumProviderTier: 'platinum', noticeBracket: '30m-1h' } },
  { maxHours: 0.5, penalty: { penaltyPercent: 100, adminFee: 50, surgePremium: 0.50, minimumProviderTier: 'platinum', noticeBracket: '<30m' } },
];

// Provider incentive bonuses (paid from penalty pool)
const PROVIDER_INCENTIVE: Record<ProviderTier, number> = {
  platinum: 0.20, // +20%
  gold: 0.15,     // +15%
  silver: 0.10,   // +10%
  bronze: 0.05,   // +5%
};

// Repeat offender surcharges (within 30 days)
const REPEAT_SURCHARGES: Record<number, number> = {
  2: 0.05,  // 2nd change: +5%
  3: 0.15,  // 3rd: +15%
  4: 0.25,  // 4th: +25%
  5: 0.30,  // 5+: +30%
};

/**
 * Get penalty tier based on hours of notice
 */
function getPenaltyTier(hoursNotice: number): ChangePenalty {
  // Sort tiers from most restrictive to least
  for (const tier of PENALTY_TIERS.sort((a, b) => a.maxHours - b.maxHours)) {
    if (hoursNotice <= tier.maxHours) {
      return tier.penalty;
    }
  }
  return PENALTY_TIERS[0].penalty;
}

/**
 * Calculate same-day change quote
 */
export function calculateChangeQuote(params: {
  request: ChangeRequest;
  originalAmount: number;
  serviceDate: Date;
  serviceTime: string;
  providerTier?: ProviderTier;
  changesInLast30Days?: number;
}): ChangeQuote {
  const { request, originalAmount, serviceDate, serviceTime, providerTier = 'bronze', changesInLast30Days = 0 } = params;

  // Calculate hours of notice
  const now = new Date();
  const [h, m] = serviceTime.split(':').map(Number);
  const serviceDateTime = new Date(serviceDate);
  serviceDateTime.setHours(h, m, 0, 0);
  const hoursNotice = Math.max(0, (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  // Check if service already started
  if (hoursNotice <= 0) {
    return {
      request,
      originalAmount,
      penaltyAmount: originalAmount,
      adminFee: 50,
      surgePremium: 0,
      providerIncentiveBonus: 0,
      repeatOffenderSurcharge: 0,
      totalAdditionalCost: originalAmount + 50,
      minimumProviderTier: 'platinum',
      allowed: false,
      reason: 'Service has already started or passed. Cannot modify.',
    };
  }

  const penalty = getPenaltyTier(hoursNotice);
  const penaltyAmount = Math.round(originalAmount * (penalty.penaltyPercent / 100) * 100) / 100;
  const surgePremiumAmount = Math.round(originalAmount * penalty.surgePremium * 100) / 100;

  // Provider incentive bonus
  const incentiveRate = PROVIDER_INCENTIVE[providerTier] || 0.05;
  const providerIncentiveBonus = Math.round(penaltyAmount * incentiveRate * 100) / 100;

  // Repeat offender surcharge
  let repeatRate = 0;
  if (changesInLast30Days >= 5) repeatRate = REPEAT_SURCHARGES[5];
  else if (changesInLast30Days >= 2) repeatRate = REPEAT_SURCHARGES[changesInLast30Days] || 0;
  const repeatOffenderSurcharge = Math.round(originalAmount * repeatRate * 100) / 100;

  const totalAdditionalCost = penaltyAmount + penalty.adminFee + surgePremiumAmount + repeatOffenderSurcharge;

  return {
    request,
    originalAmount,
    penaltyAmount,
    adminFee: penalty.adminFee,
    surgePremium: surgePremiumAmount,
    providerIncentiveBonus,
    repeatOffenderSurcharge,
    totalAdditionalCost,
    minimumProviderTier: penalty.minimumProviderTier,
    allowed: true,
  };
}
