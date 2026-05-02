import { calculatePricing } from './pricing';

describe('calculatePricing', () => {
  test('AU weekend normal morning', () => {
    const result = calculatePricing({
      country_code: 'AU',
      service_type: 'cleaning',
      base_rate: 100,
      weekend_loading: 0.2,
      holiday_loading: 1.5,
      time_of_day_multiplier: 1.0,
      duration_minutes: 60,
      platform_fee_rate: 0.1,
      currency: 'AUD',
      is_weekend: true,
      is_holiday: false,
    });
    expect(result.customer_total).toBe(7920); // 100*60 + 100*60*0.2 + 0 + 0 * 1.1
    expect(result.provider_payout).toBe(7200);
    expect(result.platform_fee).toBe(720);
  });

  test('CA holiday evening', () => {
    const result = calculatePricing({
      country_code: 'CA',
      service_type: 'cooking',
      base_rate: 120,
      weekend_loading: 0.15,
      holiday_loading: 2.0,
      time_of_day_multiplier: 1.2,
      duration_minutes: 90,
      platform_fee_rate: 0.1,
      currency: 'CAD',
      is_weekend: false,
      is_holiday: true,
    });
    expect(result.customer_total).toBe(42768); // 120*90 + 0 + 120*90*2.0 + (120*90 + 0 + 120*90*2.0)*0.2 * 1.1
  });

  // Add more tests for other countries and edge cases
});