// filepath: lib/pricing.ts
import { supabase } from './supabase';

// =====================================================
// PRICING TYPES
// =====================================================

export interface PricingInput {
  serviceId: string;
  providerId: string;
  countryCode: 'AU' | 'CA';
  bookingDate: string; // ISO date string
  bookingTime: string; // HH:MM format
  duration: number; // in hours
}

export interface PricingBreakdown {
  basePrice: number;
  dayTypeMultiplier: number;
  timeSlotMultiplier: number;
  weekendLoading: number;
  holidayLoading: number;
  providerOverride: number | null;
  serviceOverride: number | null;
  subtotal: number;
  platformFee: number;
  providerPayout: number;
  customerTotal: number;
  currency: string;
  dayType: 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  holidayName?: string;
}

export interface PricingResult {
  customer_total: number;
  provider_payout: number;
  platform_fee: number;
  currency: string;
  breakdown: PricingBreakdown;
}

export interface AvailabilitySlot {
  day: number;
  dayName: string;
  start: string;
  end: string;
  available: boolean;
}

export interface BlockedTime {
  id: string;
  blockedDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
}

// =====================================================
// COUNTRY-AWARE BASE RATES (per hour)
// =====================================================

export const BASE_RATES: Record<string, Record<string, { min: number; max: number }>> = {
  AU: {
    'cleaning': { min: 35, max: 55 },
    'deep_cleaning': { min: 50, max: 80 },
    'support_work': { min: 55, max: 75 },
    'handyman': { min: 70, max: 120 },
  },
  CA: {
    'cleaning': { min: 25, max: 40 },
    'deep_cleaning': { min: 40, max: 60 },
    'support_work': { min: 28, max: 45 },
    'handyman': { min: 60, max: 100 },
  },
};

// =====================================================
// LOADING MULTIPLIERS
// =====================================================

export const WEEKEND_LOADING: Record<string, number> = {
  AU: .20, // +20%
  CA: .15, // +15%
};

export const HOLIDAY_LOADING: Record<string, number> = {
  AU: 1.5, // +150%
  CA: 2.0, // +200%
};

export const TIME_OF_DAY_MULTIPLIERS: Record<string, Record<string, number>> = {
  AU: {
    'morning': 1,    // 06:00-12:00
    'afternoon': 1,  // 12:00-17:00
    'evening': 1.25,   // 17:00-22:00
    'night': 1.5,      // 22:00-06:00
  },
  CA: {
    'morning': 1,
    'afternoon': 1,
    'evening': 1.2,
    'night': 1.4,
  },
};

// =====================================================
// PLATFORM FEE CONFIGURATION
// =====================================================

export const DEFAULT_PLATFORM_FEE_PERCENT = 0.15; // 15%

export function getPlatformFee(subtotal: number, customRate?: number): number {
  const rate = customRate ?? DEFAULT_PLATFORM_FEE_PERCENT;
  return Math.round(subtotal * rate * 100) / 100;
}

// =====================================================
// AU PUBLIC HOLIDAYS 2026-2028
// =====================================================

const AU_HOLIDAYS: Record<string, string> = {
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-01-26': "Australia Day",
  '2026-03-08': "Labour Day",
  '2026-04-03': "Good Friday",
  '2026-04-04': "Saturday",
  '2026-04-05': "Easter Sunday",
  '2026-04-06': "Easter Monday",
  '2026-04-25': "Anzac Day",
  '2026-06-08': "Queen's Birthday",
  '2026-09-28': "AFL Grand Final Day",
  '2026-11-03': "Melbourne Cup Day",
  '2026-12-25': "Christmas Day",
  '2026-12-26': "Boxing Day",
  '2026-12-28': "Public Holiday",
  // 2027
  '2027-01-01': "New Year's Day",
  '2027-01-26': "Australia Day",
  '2027-03-08': "Labour Day",
  '2027-04-02': "Good Friday",
  '2027-04-03': "Saturday",
  '2027-04-04': "Easter Sunday",
  '2027-04-05': "Easter Monday",
  '2027-04-25': "Anzac Day",
  '2027-06-14': "Queen's Birthday",
  '2027-09-27': "AFL Grand Final Day",
  '2027-11-02': "Melbourne Cup Day",
  '2027-12-25': "Christmas Day",
  '2027-12-26': "Boxing Day",
  '2027-12-27': "Public Holiday",
  // 2028
  '2028-01-01': "New Year's Day",
  '2028-01-26': "Australia Day",
  '2028-03-13': "Labour Day",
  '2028-04-14': "Good Friday",
  '2028-04-15': "Saturday",
  '2028-04-16': "Easter Sunday",
  '2028-04-17': "Easter Monday",
  '2028-04-25': "Anzac Day",
  '2028-06-12': "Queen's Birthday",
  '2028-10-02': "AFL Grand Final Day",
  '2028-11-07': "Melbourne Cup Day",
  '2028-12-25': "Christmas Day",
  '2028-12-26': "Boxing Day",
};

// =====================================================
// CA PUBLIC HOLIDAYS 2026-2028
// =====================================================

const CA_HOLIDAYS: Record<string, string> = {
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-02-16': "Family Day",
  '2026-04-03': "Good Friday",
  '2026-05-18': "Victoria Day",
  '2026-07-01': "Canada Day",
  '2026-08-03': "Civic Holiday",
  '2026-09-07': "Labour Day",
  '2026-10-12': "Thanksgiving",
  '2026-11-11': "Remembrance Day",
  '2026-12-25': "Christmas Day",
  '2026-12-26': "Boxing Day",
  // 2027
  '2027-01-01': "New Year's Day",
  '2027-02-15': "Family Day",
  '2027-04-02': "Good Friday",
  '2027-05-17': "Victoria Day",
  '2027-07-01': "Canada Day",
  '2027-08-02': "Civic Holiday",
  '2027-09-06': "Labour Day",
  '2027-10-11': "Thanksgiving",
  '2027-11-11': "Remembrance Day",
  '2027-12-25': "Christmas Day",
  '2027-12-26': "Boxing Day",
  // 2028
  '2028-01-01': "New Year's Day",
  '2028-02-21': "Family Day",
  '2028-04-14': "Good Friday",
  '2028-05-15': "Victoria Day",
  '2028-07-01': "Canada Day",
  '2028-08-07': "Civic Holiday",
  '2028-09-04': "Labour Day",
  '2028-10-09': "Thanksgiving",
  '2028-11-11': "Remembrance Day",
  '2028-12-25': "Christmas Day",
  '2028-12-26': "Boxing Day",
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get the day type for a given date
 */
export function getDayType(date: Date | string, countryCode: string = 'AU'): 'weekday' | 'saturday' | 'sunday' | 'public_holiday' {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  
  // Check if it's a public holiday
  const holidays = countryCode === 'CA' ? CA_HOLIDAYS : AU_HOLIDAYS;
  if (holidays[dateStr]) {
    return 'public_holiday';
  }
  
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0) return 'sunday';
  if (dayOfWeek === 6) return 'saturday';
  return 'weekday';
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || 'Unknown';
}

export function getDayKey(dayOfWeek: number): string {
  return DAY_KEYS[dayOfWeek] || 'Sun';
}

/**
 * Get time slot name based on time
 */
export function getTimeSlot(time: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = Number.parseInt(time.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Check if a date is a public holiday
 */
export function isPublicHoliday(date: Date | string, countryCode: string = 'AU'): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  const holidays = countryCode === 'CA' ? CA_HOLIDAYS : AU_HOLIDAYS;
  return !!holidays[dateStr];
}

/**
 * Get public holiday name for a date
 */
export function getPublicHolidayName(date: Date | string, countryCode: string = 'AU'): string | null {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  const holidays = countryCode === 'CA' ? CA_HOLIDAYS : AU_HOLIDAYS;
  return holidays[dateStr] || null;
}

/**
 * Get base price for a service in a country
 */
export function getBasePrice(serviceId: string, countryCode: string): number {
  // Map service IDs to pricing categories
  const serviceCategoryMap: Record<string, string> = {
    's1': 'cleaning', 's2': 'cleaning', 's10': 'cleaning', 's12': 'cleaning',
    's3': 'support_work', 's4': 'support_work', 's6': 'support_work', 's7': 'support_work',
    's8': 'support_work', 's9': 'support_work',
    's5': 'handyman', 's11': 'handyman',
    'ca1': 'cleaning', 'ca2': 'support_work', 'ca3': 'handyman', 'ca4': 'support_work',
    'ca5': 'support_work', 'ca6': 'support_work',
  };
  
  const category = serviceCategoryMap[serviceId] || 'cleaning';
  const rates = BASE_RATES[countryCode]?.[category];
  
  if (!rates) {
    // Default fallback
    return countryCode === 'AU' ? 45 : 35;
  }
  
  // Return average of min/max as base price
  return (rates.min + rates.max) / 2;
}

/**
 * Calculate booking price with all multipliers
 */
export async function calculatePrice(input: PricingInput): Promise<PricingResult> {
  const { serviceId, providerId, countryCode, bookingDate, bookingTime, duration } = input;
  
  const dayType = getDayType(bookingDate, countryCode);
  const timeSlot = getTimeSlot(bookingTime);
  const currency = countryCode === 'AU' ? 'AUD' : 'CAD';
  
  // Get base service price
  let basePrice = getBasePrice(serviceId, countryCode);
  
  // Try to get from database
  const { data: servicePrice } = await supabase
    .from('service_prices')
    .select('base_price')
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .single();
  
  if (servicePrice?.base_price) {
    basePrice = servicePrice.base_price;
  }
  
  // Get service-specific override
  let serviceOverride: number | null = null;
  const { data: serviceOverrideData } = await supabase
    .from('service_price_overrides')
    .select('override_price')
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .single();
  
  if (serviceOverrideData?.override_price) {
    serviceOverride = serviceOverrideData.override_price;
  }
  
  // Get provider-specific override
  let providerOverride: number | null = null;
  const { data: providerOverrideData } = await supabase
    .from('provider_pricing')
    .select('custom_price')
    .eq('provider_id', providerId)
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .single();
  
  if (providerOverrideData?.custom_price) {
    providerOverride = providerOverrideData.custom_price;
  }
  
  // Calculate multipliers
  let dayTypeMultiplier = 1.0;
  let weekendLoading = 0;
  let holidayLoading = 0;
  
  if (dayType === 'saturday') {
    weekendLoading = WEEKEND_LOADING[countryCode] || 0;
    dayTypeMultiplier = 1 + weekendLoading;
  } else if (dayType === 'sunday') {
    weekendLoading = WEEKEND_LOADING[countryCode] || 0;
    dayTypeMultiplier = 1 + weekendLoading;
  } else if (dayType === 'public_holiday') {
    holidayLoading = HOLIDAY_LOADING[countryCode] || 0;
    dayTypeMultiplier = 1 + holidayLoading;
  }
  
  // Time of day multiplier
  const timeSlotMultiplier = TIME_OF_DAY_MULTIPLIERS[countryCode][timeSlot] || 1.0;
  
  // Calculate subtotal
  let hourlyRate = basePrice;
  
  if (providerOverride) {
    hourlyRate = providerOverride;
  } else if (serviceOverride) {
    hourlyRate = serviceOverride;
  }
  
  const subtotal = hourlyRate * dayTypeMultiplier * timeSlotMultiplier * duration;
  
  // Calculate platform fee and provider payout
  const platformFee = getPlatformFee(subtotal);
  const providerPayout = subtotal - platformFee;
  const customerTotal = Math.round(subtotal * 100) / 100;
  
  // Get holiday name if applicable
  const holidayName = dayType === 'public_holiday' ? getPublicHolidayName(bookingDate, countryCode) : undefined;
  
  const breakdown: PricingBreakdown = {
    basePrice: hourlyRate,
    dayTypeMultiplier,
    timeSlotMultiplier,
    weekendLoading,
    holidayLoading,
    providerOverride,
    serviceOverride,
    subtotal: Math.round(subtotal * 100) / 100,
    platformFee,
    providerPayout: Math.round(providerPayout * 100) / 100,
    customerTotal,
    currency,
    dayType,
    timeSlot,
    holidayName,
  };
  
  return {
    customer_total: customerTotal,
    provider_payout: Math.round(providerPayout * 100) / 100,
    platform_fee: platformFee,
    currency,
    breakdown,
  };
}

/**
 * Calculate price synchronously (without database)
 */
export function calculatePriceSync(input: Omit<PricingInput, 'providerId'> & { providerHourlyRate?: number }): PricingResult {
  const { serviceId, countryCode, bookingDate, bookingTime, duration, providerHourlyRate } = input;
  
  const dayType = getDayType(bookingDate, countryCode);
  const timeSlot = getTimeSlot(bookingTime);
  const currency = countryCode === 'AU' ? 'AUD' : 'CAD';
  
  // Get base service price
  let basePrice = getBasePrice(serviceId, countryCode);
  
  // Use provider hourly rate if provided
  if (providerHourlyRate) {
    basePrice = providerHourlyRate;
  }
  
  // Calculate multipliers
  let dayTypeMultiplier = 1.0;
  let weekendLoading = 0;
  let holidayLoading = 0;
  
  if (dayType === 'saturday') {
    weekendLoading = WEEKEND_LOADING[countryCode] || 0;
    dayTypeMultiplier = 1 + weekendLoading;
  } else if (dayType === 'sunday') {
    weekendLoading = WEEKEND_LOADING[countryCode] || 0;
    dayTypeMultiplier = 1 + weekendLoading;
  } else if (dayType === 'public_holiday') {
    holidayLoading = HOLIDAY_LOADING[countryCode] || 0;
    dayTypeMultiplier = 1 + holidayLoading;
  }
  
  // Time of day multiplier
  const timeSlotMultiplier = TIME_OF_DAY_MULTIPLIERS[countryCode][timeSlot] || 1.0;
  
  // Calculate subtotal
  const subtotal = basePrice * dayTypeMultiplier * timeSlotMultiplier * duration;
  
  // Calculate platform fee and provider payout
  const platformFee = getPlatformFee(subtotal);
  const providerPayout = subtotal - platformFee;
  const customerTotal = Math.round(subtotal * 100) / 100;
  
  // Get holiday name if applicable
  const holidayName = dayType === 'public_holiday' ? getPublicHolidayName(bookingDate, countryCode) : undefined;
  
  const breakdown: PricingBreakdown = {
    basePrice,
    dayTypeMultiplier,
    timeSlotMultiplier,
    weekendLoading,
    holidayLoading,
    providerOverride: providerHourlyRate ?? null,
    serviceOverride: null,
    subtotal: Math.round(subtotal * 100) / 100,
    platformFee,
    providerPayout: Math.round(providerPayout * 100) / 100,
    customerTotal,
    currency,
    dayType,
    timeSlot,
    holidayName,
  };
  
  return {
    customer_total: customerTotal,
    provider_payout: Math.round(providerPayout * 100) / 100,
    platform_fee: platformFee,
    currency,
    breakdown,
  };
}

/**
 * Check if provider is available at specific date/time
 */
export async function isProviderAvailable(
  providerId: string,
  bookingDate: string,
  bookingTime: string
): Promise<{ available: boolean; reason?: string }> {
  const date = new Date(bookingDate);
  const dayOfWeek = date.getDay();
  
  // Check provider availability for this day
  const { data: availability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .single();
  
  if (!availability) {
    return { available: false, reason: 'Provider not available on this day' };
  }
  
  // Check if time falls within availability window
  const startTime = availability.start_time;
  const endTime = availability.end_time;
  
  if (bookingTime < startTime || bookingTime > endTime) {
    return { available: false, reason: `Provider only available from ${startTime} to ${endTime}` };
  }
  
  // Check for blocked times
  const dateStr = bookingDate.split('T')[0];
  const { data: blockedTimes } = await supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', providerId)
    .eq('blocked_date', dateStr);
  
  if (blockedTimes && blockedTimes.length > 0) {
    for (const block of blockedTimes) {
      const blockStart = block.start_time || '00:00';
      const blockEnd = block.end_time || '23:59';
      
      if (bookingTime >= blockStart && bookingTime <= blockEnd) {
        return { available: false, reason: block.reason || 'Time is blocked' };
      }
    }
  }
  
  // Check for existing bookings at this time
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .eq('booking_date', dateStr)
    .eq('status', 'confirmed');
  
  if (existingBookings && existingBookings.length > 0) {
    for (const booking of existingBookings) {
      const bookingStart = booking.start_time;
      const bookingEnd = calculateEndTime(bookingStart, booking.duration_hours);
      
      if (bookingTime >= bookingStart && bookingTime < bookingEnd) {
        return { available: false, reason: 'Provider has a booking at this time' };
      }
    }
  }
  
  return { available: true };
}

/**
 * Calculate end time from start time and duration
 */
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    AUD: 'A$',
    CAD: 'C$',
    CNY: '¥',
  };
  return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
}

/**
 * Get pricing explanation for AI
 */
export function getPricingExplanation(
  countryCode: string,
  dayType: string,
  timeSlot: string,
  holidayName?: string
): string[] {
  const explanations: string[] = [];
  
  // Base rate explanation
  explanations.push(`Base rates in ${countryCode === 'AU' ? 'Australia' : 'Canada'} vary by service type.`);
  
  // Day type explanation
  if (dayType === 'public_holiday' && holidayName) {
    explanations.push(`This booking falls on ${holidayName}, so a ${Math.round(HOLIDAY_LOADING[countryCode] * 100)}% loading applies.`);
  } else if (dayType === 'saturday' || dayType === 'sunday') {
    explanations.push(`Weekend bookings in ${countryCode === 'AU' ? 'Australia' : 'Canada'} include a ${Math.round(WEEKEND_LOADING[countryCode] * 100)}% loading.`);
  }
  
  // Time slot explanation
  if (timeSlot === 'evening' || timeSlot === 'night') {
    const multiplier = TIME_OF_DAY_MULTIPLIERS[countryCode][timeSlot];
    explanations.push(`${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} bookings in ${countryCode === 'AU' ? 'Australia' : 'Canada'} include a ${multiplier}× multiplier.`);
  }
  
  return explanations;
}

export { AU_HOLIDAYS, CA_HOLIDAYS };

/**
 * Get the day type for a given date
 */
export function getDayType(date: Date | string, countryCode: string = 'AU'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  
  // Check if it's a public holiday
  if (AU_HOLIDAYS[dateStr]) {
    return 'public_holiday';
  }
  
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0) return 'sunday';
  if (dayOfWeek === 6) return 'saturday';
  return 'weekday';
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || 'Unknown';
}

export function getDayKey(dayOfWeek: number): string {
  return DAY_KEYS[dayOfWeek] || 'Sun';
}

/**
 * Get time slot name based on time
 */
export function getTimeSlot(time: string): string {
  const hour = Number.parseInt(time.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Check if a date is a public holiday
 */
export function isPublicHoliday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  return !!AU_HOLIDAYS[dateStr];
}

/**
 * Get public holiday name for a date
 */
export function getPublicHolidayName(date: Date | string): string | null {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];
  return AU_HOLIDAYS[dateStr] || null;
}

/**
 * Calculate booking price with all multipliers
 */
export async function calculatePrice(
  serviceId: string,
  providerId: string,
  countryCode: string,
  bookingDate: string,
  bookingTime: string
): Promise<PricingResult> {
  const dayType = getDayType(bookingDate, countryCode);
  const timeSlot = getTimeSlot(bookingTime);
  
  // Get base service price
  const { data: servicePrice } = await supabase
    .from('service_prices')
    .select('base_price, price_with_tax')
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .single();
  
  const basePrice = servicePrice?.base_price || 0;
  
  // Get pricing tier multiplier
  const { data: pricingTier } = await supabase
    .from('pricing_tiers')
    .select('price_multiplier')
    .eq('country_code', countryCode)
    .eq('day_type', dayType)
    .lte('time_slot_start', bookingTime)
    .gte('time_slot_end', bookingTime)
    .single();
  
  const dayTypeMultiplier = pricingTier?.price_multiplier || 1.0;
  
  // Get service-specific override
  const { data: serviceOverride } = await supabase
    .from('service_price_overrides')
    .select('override_price, price_multiplier')
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .or('day_type.is.null,day_type.eq.' + dayType)
    .single();
  
  // Get provider-specific override
  const { data: providerOverride } = await supabase
    .from('provider_pricing')
    .select('custom_price, price_multiplier')
    .eq('provider_id', providerId)
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .eq('is_active', true)
    .or('day_type.is.null,day_type.eq.' + dayType)
    .single();
  
  // Calculate final price
  let finalPrice = basePrice;
  
  if (providerOverride?.custom_price) {
    finalPrice = providerOverride.custom_price;
  } else if (serviceOverride?.override_price) {
    finalPrice = serviceOverride.override_price * dayTypeMultiplier;
  } else {
    finalPrice = basePrice * dayTypeMultiplier;
  }
  
  return {
    basePrice,
    dayTypeMultiplier,
    timeSlotMultiplier: 1.0,
    serviceOverride: serviceOverride?.override_price || null,
    providerOverride: providerOverride?.custom_price || null,
    finalPrice: Math.round(finalPrice * 100) / 100,
    currency: countryCode === 'AU' ? 'AUD' : countryCode === 'CN' ? 'CNY' : 'CAD',
    dayType,
  };
}

/**
 * Check if provider is available at specific date/time
 */
export async function isProviderAvailable(
  providerId: string,
  bookingDate: string,
  bookingTime: string
): Promise<boolean> {
  const date = new Date(bookingDate);
  const dayOfWeek = date.getDay();
  
  // Check blocked times first
  const { data: blockedTimes } = await supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', providerId)
    .eq('blocked_date', bookingDate);
  
  if (blockedTimes && blockedTimes.length > 0) {
    for (const block of blockedTimes) {
      if (!block.start_time || !block.end_time) {
        // Entire day blocked
        return false;
      }
      if (bookingTime >= block.start_time && bookingTime <= block.end_time) {
        return false;
      }
    }
  }
  
  // Check recurring availability
  const { data: availability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .eq('is_recurring', true);
  
  if (availability && availability.length > 0) {
    for (const slot of availability) {
      if (bookingTime >= slot.start_time && bookingTime <= slot.end_time) {
        return true;
      }
    }
  }
  
  // Check one-time availability for specific date
  const { data: oneTimeAvailability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('specific_date', bookingDate)
    .eq('is_available', true);
  
  if (oneTimeAvailability && oneTimeAvailability.length > 0) {
    for (const slot of oneTimeAvailability) {
      if (bookingTime >= slot.start_time && bookingTime <= slot.end_time) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get provider's availability for a date range
 */
export async function getProviderAvailability(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> {
  const slots: AvailabilitySlot[] = [];
  
  // Get recurring availability
  const { data: recurring } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_recurring', true)
    .eq('is_available', true)
    .order('day_of_week');
  
  if (recurring) {
    for (const slot of recurring) {
      slots.push({
        day: slot.day_of_week,
        dayName: getDayName(slot.day_of_week),
        start: slot.start_time,
        end: slot.end_time,
        available: slot.is_available,
      });
    }
  }
  
  // Get one-time availability for date range
  const { data: oneTime } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_recurring', false)
    .gte('specific_date', startDate)
    .lte('specific_date', endDate)
    .eq('is_available', true);
  
  if (oneTime) {
    for (const slot of oneTime) {
      const date = new Date(slot.specific_date);
      slots.push({
        day: date.getDay(),
        dayName: getDayName(date.getDay()),
        start: slot.start_time,
        end: slot.end_time,
        available: slot.is_available,
      });
    }
  }
  
  return slots;
}

/**
 * Get provider's blocked times for a date range
 */
export async function getProviderBlockedTimes(
  providerId: string,
  startDate: string,
  endDate: string
): Promise<BlockedTime[]> {
  const { data, error } = await supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', providerId)
    .gte('blocked_date', startDate)
    .lte('blocked_date', endDate)
    .order('blocked_date');
  
  if (error) {
    console.error('Error fetching blocked times:', error);
    return [];
  }
  
  return (data || []).map(block => ({
    id: block.id,
    blockedDate: block.blocked_date,
    startTime: block.start_time,
    endTime: block.end_time,
    reason: block.reason,
  }));
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = Number.parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Get default availability slots (9 AM - 5 PM weekdays)
 */
export function getDefaultAvailability(): AvailabilitySlot[] {
  return [
    { day: 1, dayName: 'Monday', start: '09:00', end: '17:00', available: true },
    { day: 2, dayName: 'Tuesday', start: '09:00', end: '17:00', available: true },
    { day: 3, dayName: 'Wednesday', start: '09:00', end: '17:00', available: true },
    { day: 4, dayName: 'Thursday', start: '09:00', end: '17:00', available: true },
    { day: 5, dayName: 'Friday', start: '09:00', end: '17:00', available: true },
  ];
}

/**
 * Get all AU public holidays
 */
export function getPublicHolidays(): Record<string, string> {
  return { ...AU_HOLIDAYS };
}