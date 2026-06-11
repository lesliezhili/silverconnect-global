/**
 * Market-Competitive Dynamic Pricing Engine
 * 
 * Benchmarked against:
 * - NDIS Price Guide 2025-26: $57.10-$148.73/h
 * - TAC: $72-$242/h attendant care
 * - WorkSafe Victoria: $69.50-$187/h
 * - Mable: $45-52/h median
 * - Jim's Cleaning: $65/h, Jim's Mowing: $75/h, Jim's Handyman: $90/h
 * - Airtasker: task-based
 * 
 * SilverConnect positioning: 24-29% below Jim's, competitive with Mable
 * Platform fee: 15% (vs Jim's 30%, Mable 5%)
 */

export type Country = 'AU' | 'CN' | 'CA' | 'US' | 'TW' | 'SG' | 'HK' | 'MY';
export type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
export type TimeBracket = 'standard' | 'early_morning' | 'evening' | 'overnight';
export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';
export type DemandLevel = 'shortage' | 'balanced' | 'oversupply';
export type ProviderTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type FundingSource = 'self' | 'ndis' | 'tac' | 'worksafe' | 'hcp' | 'dva';

export interface PriceQuote {
  baseRate: number;
  finalRate: number;
  platformFee: number;
  providerEarnings: number;
  multipliers: MultiplierBreakdown;
  fundingCap?: number;
  fundingSource: FundingSource;
  currency: string;
  comparison: CompetitorComparison;
}

export interface MultiplierBreakdown {
  dayType: number;
  timeBracket: number;
  urgency: number;
  demand: number;
  seasonal: number;
  loyalty: number;
  providerTier: number;
  total: number;
}

export interface CompetitorComparison {
  jimsCleaning?: number;
  mable?: number;
  ndisMax?: number;
  savings: string;
}

// Base rates by category and country (AUD)
const BASE_RATES: Record<string, Record<Country, number>> = {
  'domestic.generalClean': { AU: 49.50, CN: 25.00, CA: 42.00, US: 45.36, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'domestic.deepClean': { AU: 65.00, CN: 35.00, CA: 55.00, US: 59.4, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'domestic.laundry': { AU: 42.00, CN: 20.00, CA: 38.00, US: 41.04, TW: 280.0, SG: 36.0, HK: 120.0, MY: 50.0 },
  'domestic.ironing': { AU: 40.00, CN: 18.00, CA: 35.00, US: 37.8, TW: 252.0, SG: 32.4, HK: 108.0, MY: 45.0 },
  'domestic.windowClean': { AU: 55.00, CN: 28.00, CA: 48.00, US: 51.84, TW: 392.0, SG: 50.4, HK: 168.0, MY: 70.0 },
  'domestic.ovenClean': { AU: 60.00, CN: 30.00, CA: 52.00, US: 56.16, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'domestic.carpetClean': { AU: 58.00, CN: 28.00, CA: 50.00, US: 54.0, TW: 392.0, SG: 50.4, HK: 168.0, MY: 70.0 },
  'domestic.pantryOrganise': { AU: 52.00, CN: 25.00, CA: 45.00, US: 48.6, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'garden.lawnMow': { AU: 53.00, CN: 22.00, CA: 45.00, US: 48.6, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'garden.hedgeTrim': { AU: 58.00, CN: 25.00, CA: 50.00, US: 54.0, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'garden.weeding': { AU: 50.00, CN: 20.00, CA: 42.00, US: 45.36, TW: 280.0, SG: 36.0, HK: 120.0, MY: 50.0 },
  'garden.planting': { AU: 55.00, CN: 22.00, CA: 48.00, US: 51.84, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'garden.gutterClean': { AU: 65.00, CN: 30.00, CA: 55.00, US: 59.4, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'garden.pressureWash': { AU: 70.00, CN: 35.00, CA: 60.00, US: 64.8, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'garden.treeTrims': { AU: 75.00, CN: 35.00, CA: 65.00, US: 70.2, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'garden.gardenDesign': { AU: 80.00, CN: 40.00, CA: 70.00, US: 75.6, TW: 560.0, SG: 72.0, HK: 240.0, MY: 100.0 },
  'repair.plumbing': { AU: 72.00, CN: 35.00, CA: 62.00, US: 66.96, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'repair.electrical': { AU: 78.00, CN: 38.00, CA: 68.00, US: 73.44, TW: 532.0, SG: 68.4, HK: 228.0, MY: 95.0 },
  'repair.painting': { AU: 64.70, CN: 30.00, CA: 55.00, US: 59.4, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'repair.carpentry': { AU: 70.00, CN: 35.00, CA: 60.00, US: 64.8, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'repair.locksmith': { AU: 85.00, CN: 40.00, CA: 75.00, US: 81.0, TW: 560.0, SG: 72.0, HK: 240.0, MY: 100.0 },
  'repair.appliance': { AU: 75.00, CN: 38.00, CA: 65.00, US: 70.2, TW: 532.0, SG: 68.4, HK: 228.0, MY: 95.0 },
  'repair.roofRepair': { AU: 90.00, CN: 45.00, CA: 80.00, US: 86.4, TW: 630.0, SG: 81.0, HK: 270.0, MY: 112.5 },
  'repair.generalHandy': { AU: 64.70, CN: 30.00, CA: 55.00, US: 59.4, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'personal.shower': { AU: 56.50, CN: 30.00, CA: 50.00, US: 54.0, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'personal.dressing': { AU: 56.50, CN: 30.00, CA: 50.00, US: 54.0, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'personal.medication': { AU: 56.50, CN: 30.00, CA: 50.00, US: 54.0, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'personal.mealPrep': { AU: 52.00, CN: 25.00, CA: 45.00, US: 48.6, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'personal.mobility': { AU: 58.00, CN: 32.00, CA: 52.00, US: 56.16, TW: 448.0, SG: 57.6, HK: 192.0, MY: 80.0 },
  'personal.grooming': { AU: 52.00, CN: 25.00, CA: 45.00, US: 48.6, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'personal.nightCare': { AU: 65.00, CN: 35.00, CA: 58.00, US: 62.64, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'personal.respite': { AU: 56.50, CN: 30.00, CA: 50.00, US: 54.0, TW: 420.0, SG: 54.0, HK: 180.0, MY: 75.0 },
  'companion.socialVisit': { AU: 48.00, CN: 22.00, CA: 42.00, US: 45.36, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'companion.walk': { AU: 48.00, CN: 22.00, CA: 42.00, US: 45.36, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'companion.shopping': { AU: 50.00, CN: 25.00, CA: 44.00, US: 47.52, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'companion.entertainment': { AU: 48.00, CN: 22.00, CA: 42.00, US: 45.36, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'companion.reading': { AU: 45.00, CN: 20.00, CA: 40.00, US: 43.2, TW: 280.0, SG: 36.0, HK: 120.0, MY: 50.0 },
  'companion.technology': { AU: 52.00, CN: 25.00, CA: 45.00, US: 48.6, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'companion.petCare': { AU: 50.00, CN: 22.00, CA: 44.00, US: 47.52, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'companion.gardenChat': { AU: 48.00, CN: 22.00, CA: 42.00, US: 45.36, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'transport.medical': { AU: 55.00, CN: 28.00, CA: 48.00, US: 51.84, TW: 392.0, SG: 50.4, HK: 168.0, MY: 70.0 },
  'transport.shopping': { AU: 50.00, CN: 25.00, CA: 44.00, US: 47.52, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'transport.social': { AU: 50.00, CN: 25.00, CA: 44.00, US: 47.52, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'transport.airport': { AU: 65.00, CN: 35.00, CA: 58.00, US: 62.64, TW: 490.0, SG: 63.0, HK: 210.0, MY: 87.5 },
  'transport.worship': { AU: 48.00, CN: 22.00, CA: 42.00, US: 45.36, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
  'transport.exercise': { AU: 50.00, CN: 25.00, CA: 44.00, US: 47.52, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'transport.banking': { AU: 50.00, CN: 25.00, CA: 44.00, US: 47.52, TW: 350.0, SG: 45.0, HK: 150.0, MY: 62.5 },
  'transport.regular': { AU: 48.00, CN: 22.00, CA: 42.00, US: 45.36, TW: 308.0, SG: 39.6, HK: 132.0, MY: 55.0 },
};

// 7 dynamic multipliers
const DAY_MULTIPLIERS: Record<DayType, number> = {
  weekday: 1.0,
  saturday: 1.4,
  sunday: 1.8,
  public_holiday: 2.2,
};

const TIME_MULTIPLIERS: Record<TimeBracket, number> = {
  standard: 1.0, // 8am-6pm
  early_morning: 1.15, // 6am-8am
  evening: 1.1, // 6pm-9pm
  overnight: 1.25, // 9pm-6am
};

const URGENCY_MULTIPLIERS: Record<UrgencyLevel, number> = {
  normal: 1.0,
  urgent: 1.25, // <24h notice
  emergency: 1.5, // <4h notice
};

const DEMAND_ADJUSTMENTS: Record<DemandLevel, { min: number; max: number }> = {
  shortage: { min: 1.05, max: 1.30 },
  balanced: { min: 1.0, max: 1.0 },
  oversupply: { min: 0.90, max: 0.95 },
};

const TIER_MULTIPLIERS: Record<ProviderTier, number> = {
  bronze: 1.0,
  silver: 1.05,
  gold: 1.1,
  platinum: 1.2,
};

// NDIS price caps (2025-26)
const NDIS_PRICE_CAPS: Record<string, Record<DayType, Record<TimeBracket, number>>> = {
  personal: {
    weekday: { standard: 57.10, early_morning: 57.10, evening: 62.88, overnight: 65.00 },
    saturday: { standard: 80.14, early_morning: 80.14, evening: 80.14, overnight: 80.14 },
    sunday: { standard: 103.18, early_morning: 103.18, evening: 103.18, overnight: 103.18 },
    public_holiday: { standard: 126.22, early_morning: 126.22, evening: 126.22, overnight: 126.22 },
  },
  domestic: {
    weekday: { standard: 52.09, early_morning: 52.09, evening: 57.30, overnight: 57.30 },
    saturday: { standard: 72.93, early_morning: 72.93, evening: 72.93, overnight: 72.93 },
    sunday: { standard: 93.76, early_morning: 93.76, evening: 93.76, overnight: 93.76 },
    public_holiday: { standard: 114.60, early_morning: 114.60, evening: 114.60, overnight: 114.60 },
  },
  companion: {
    weekday: { standard: 57.10, early_morning: 57.10, evening: 62.88, overnight: 65.00 },
    saturday: { standard: 80.14, early_morning: 80.14, evening: 80.14, overnight: 80.14 },
    sunday: { standard: 103.18, early_morning: 103.18, evening: 103.18, overnight: 103.18 },
    public_holiday: { standard: 126.22, early_morning: 126.22, evening: 126.22, overnight: 126.22 },
  },
};

const PLATFORM_FEE_RATE = 0.15; // 15%

/**
 * Calculate full dynamic price quote
 */
export function calculateQuote(params: {
  serviceKey: string;
  country: Country;
  dayType: DayType;
  timeBracket: TimeBracket;
  urgency: UrgencyLevel;
  demand?: DemandLevel;
  providerTier?: ProviderTier;
  loyaltyBookings?: number;
  fundingSource?: FundingSource;
  seasonalEvent?: string;
}): PriceQuote {
  const {
    serviceKey, country, dayType, timeBracket, urgency,
    demand = 'balanced', providerTier = 'bronze',
    loyaltyBookings = 0, fundingSource = 'self', seasonalEvent,
  } = params;

  // Get base rate
  const baseRate = BASE_RATES[serviceKey]?.[country] || 50.00;

  // Calculate multipliers
  const dayMult = DAY_MULTIPLIERS[dayType];
  const timeMult = TIME_MULTIPLIERS[timeBracket];
  const urgencyMult = URGENCY_MULTIPLIERS[urgency];
  const tierMult = TIER_MULTIPLIERS[providerTier];

  // Demand (random within range for simplicity)
  const demandRange = DEMAND_ADJUSTMENTS[demand];
  const demandMult = (demandRange.min + demandRange.max) / 2;

  // Seasonal
  let seasonalMult = 1.0;
  if (seasonalEvent === 'christmas') seasonalMult = 1.25;
  else if (seasonalEvent === 'summer') seasonalMult = 1.15;
  else if (seasonalEvent === 'winter') seasonalMult = 0.90;

  // Loyalty discount
  let loyaltyMult = 1.0;
  if (loyaltyBookings >= 50) loyaltyMult = 0.90;
  else if (loyaltyBookings >= 20) loyaltyMult = 0.93;
  else if (loyaltyBookings >= 10) loyaltyMult = 0.95;
  else if (loyaltyBookings >= 5) loyaltyMult = 0.97;

  const totalMultiplier = dayMult * timeMult * urgencyMult * demandMult * seasonalMult * loyaltyMult * tierMult;
  let finalRate = Math.round(baseRate * totalMultiplier * 100) / 100;

  // Enforce funding cap
  let fundingCap: number | undefined;
  if (fundingSource === 'ndis') {
    const category = serviceKey.split('.')[0];
    const cap = NDIS_PRICE_CAPS[category]?.[dayType]?.[timeBracket];
    if (cap) {
      fundingCap = cap;
      finalRate = Math.min(finalRate, cap);
    }
  }

  const platformFee = Math.round(finalRate * PLATFORM_FEE_RATE * 100) / 100;
  const providerEarnings = Math.round((finalRate - platformFee) * 100) / 100;

  // Competitor comparison
  const comparison: CompetitorComparison = { savings: '' };
  if (serviceKey.startsWith('domestic')) {
    comparison.jimsCleaning = 65.00;
    comparison.savings = `${Math.round((1 - finalRate / 65) * 100)}% less than Jim's`;
  } else if (serviceKey.startsWith('garden')) {
    comparison.jimsCleaning = 75.00;
    comparison.savings = `${Math.round((1 - finalRate / 75) * 100)}% less than Jim's`;
  } else if (serviceKey.startsWith('personal')) {
    comparison.mable = 50.00;
    comparison.ndisMax = NDIS_PRICE_CAPS.personal?.weekday?.standard;
  }

  return {
    baseRate,
    finalRate,
    platformFee,
    providerEarnings,
    multipliers: {
      dayType: dayMult,
      timeBracket: timeMult,
      urgency: urgencyMult,
      demand: demandMult,
      seasonal: seasonalMult,
      loyalty: loyaltyMult,
      providerTier: tierMult,
      total: totalMultiplier,
    },
    fundingCap,
    fundingSource,
    currency: country === 'CN' ? 'CNY' : country === 'CA' ? 'CAD' : 'AUD',
    comparison,
  };
}

/**
 * Get time bracket from hour
 */
export function getTimeBracket(hour: number): TimeBracket {
  if (hour >= 6 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 18) return 'standard';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'overnight';
}

/**
 * Get day type from date
 */
export function getDayType(date: Date, publicHolidays: string[] = []): DayType {
  const dateStr = date.toISOString().split('T')[0];
  if (publicHolidays.includes(dateStr)) return 'public_holiday';
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'weekday';
}
