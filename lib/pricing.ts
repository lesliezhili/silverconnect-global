export interface PricingInputs {
  country_code: 'AU' | 'CA' | 'US' | 'CN';
  service_type: string;
  base_rate: number;
  weekend_loading: number;
  holiday_loading: number;
  time_of_day_multiplier: number;
  duration_minutes: number;
  platform_fee_rate: number;
  currency: string;
  is_weekend: boolean;
  is_holiday: boolean;
}

export interface PricingBreakdown {
  base: number;
  weekend: number;
  holiday: number;
  time_of_day: number;
  tax: number; // placeholder
}

export interface PricingOutput {
  customer_total: number;
  provider_payout: number;
  platform_fee: number;
  breakdown: PricingBreakdown;
}

const COUNTRY_RULES = {
  AU: {
    currency: 'AUD',
    weekend_multiplier: 1.2,
    holiday_multiplier: 2.5,
    time_multipliers: { morning: 1.0, afternoon: 1.0, evening: 1.25, night: 1.5 },
  },
  CA: {
    currency: 'CAD',
    weekend_multiplier: 1.15,
    holiday_multiplier: 3.0,
    time_multipliers: { morning: 1.0, afternoon: 1.0, evening: 1.2, night: 1.4 },
  },
  US: {
    currency: 'USD',
    weekend_multiplier: 1.15,
    holiday_multiplier: 2.5,
    time_multipliers: { morning: 1.0, afternoon: 1.0, evening: 1.2, night: 1.4 },
  },
  CN: {
    currency: 'CNY',
    weekend_multiplier: 1.1,
    holiday_multiplier: 3.0,
    time_multipliers: { morning: 1.0, afternoon: 1.0, evening: 1.1, night: 1.3 },
  },
};

export function calculatePricing(inputs: PricingInputs): PricingOutput {
  const rules = COUNTRY_RULES[inputs.country_code];
  if (!rules) {
    throw new Error(`Unsupported country code: ${inputs.country_code}`);
  }

  // Base price
  const base = inputs.base_rate * inputs.duration_minutes;

  // Weekend loading
  const weekend = inputs.is_weekend ? base * (rules.weekend_multiplier - 1) : 0;

  // Holiday loading
  const holiday = inputs.is_holiday ? base * (rules.holiday_multiplier - 1) : 0;

  // Time of day multiplier (applied to base + weekend + holiday)
  const time_of_day = (base + weekend + holiday) * (inputs.time_of_day_multiplier - 1);

  // Subtotal before platform fee
  const subtotal = base + weekend + holiday + time_of_day;

  // Platform fee
  const platform_fee = subtotal * inputs.platform_fee_rate;

  // Customer total
  const customer_total = subtotal + platform_fee;

  // Provider payout
  const provider_payout = subtotal;

  // Tax placeholder (0 for now)
  const tax = 0;

  return {
    customer_total,
    provider_payout,
    platform_fee,
    breakdown: {
      base,
      weekend,
      holiday,
      time_of_day,
      tax,
    },
  };
}

export function getTimeOfDayMultiplier(country_code: keyof typeof COUNTRY_RULES, time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'): number {
  return COUNTRY_RULES[country_code].time_multipliers[time_of_day];
}
