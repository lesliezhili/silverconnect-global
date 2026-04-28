// filepath: lib/ai/pricingTemplates.ts
import {
  getDayType,
  getTimeSlot,
  getPublicHolidayName,
  BASE_RATES,
  WEEKEND_LOADING,
  HOLIDAY_LOADING,
  TIME_OF_DAY_MULTIPLIERS,
  formatPrice,
} from '../pricing';

// =====================================================
// PRICING EXPLANATION TEMPLATES
// =====================================================

export interface PricingExplanationInput {
  countryCode: 'AU' | 'CA';
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  providerHourlyRate?: number;
}

export interface PricingExplanation {
  summary: string;
  breakdown: PricingExplanationItem[];
  recommendations: string[];
}

export interface PricingExplanationItem {
  label: string;
  value: string;
  multiplier?: number;
  isLoading?: boolean;
}

// =====================================================
// COUNTRY NAMES
// =====================================================

const COUNTRY_NAMES: Record<string, string> = {
  AU: 'Australia',
  CA: 'Canada',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AU: 'A$',
  CA: 'C$',
};

// =====================================================
// SERVICE CATEGORY MAPPING
// =====================================================

const SERVICE_CATEGORY_MAP: Record<string, string> = {
  's1': 'Home Cleaning',
  's2': 'Garden Care',
  's3': 'Personal Care',
  's4': 'Medication Assistance',
  's5': 'Transport & Escort',
  's6': 'Meal Preparation',
  's7': 'Companionship',
  's8': 'Wellness & Exercise',
  's9': 'Shopping Assistance',
  's10': 'Window Cleaning',
  's11': 'Wound Care',
  's12': 'Laundry & Ironing',
  'ca1': 'Home Cleaning',
  'ca2': 'Personal Care',
  'ca3': 'Transport',
  'ca4': 'Meal Preparation',
  'ca5': 'Companionship',
  'ca6': 'Wellness',
};

const SERVICE_CATEGORY_KEY: Record<string, string> = {
  's1': 'cleaning', 's2': 'cleaning', 's10': 'cleaning', 's12': 'cleaning',
  's3': 'support_work', 's4': 'support_work', 's6': 'support_work', 's7': 'support_work',
  's8': 'support_work', 's9': 'support_work',
  's5': 'handyman', 's11': 'handyman',
  'ca1': 'cleaning', 'ca2': 'support_work', 'ca3': 'handyman', 'ca4': 'support_work',
  'ca5': 'support_work', 'ca6': 'support_work',
};

// =====================================================
// MAIN EXPLANATION FUNCTION
// =====================================================

/**
 * Generate comprehensive pricing explanation for AI responses
 */
export function generatePricingExplanation(input: PricingExplanationInput): PricingExplanation {
  const { countryCode, serviceId, bookingDate, bookingTime, duration, providerHourlyRate } = input;
  
  const dayType = getDayType(bookingDate, countryCode);
  const timeSlot = getTimeSlot(bookingTime);
  const currency = countryCode === 'AU' ? 'AUD' : 'CAD';
  const currencySymbol = CURRENCY_SYMBOLS[countryCode];
  
  // Get base rate for service
  const category = SERVICE_CATEGORY_KEY[serviceId] || 'cleaning';
  const baseRates = BASE_RATES[countryCode]?.[category];
  const basePrice = baseRates 
    ? (baseRates.min + baseRates.max) / 2 
    : (countryCode === 'AU' ? 45 : 35);
  
  // Use provider rate if available
  const hourlyRate = providerHourlyRate || basePrice;
  
  const breakdown: PricingExplanationItem[] = [];
  const recommendations: string[] = [];
  
  // Base rate
  breakdown.push({
    label: 'Base Rate',
    value: `${currencySymbol}${hourlyRate.toFixed(2)}/hr`,
    multiplier: 1.0,
  });
  
  // Day type loading
  if (dayType === 'public_holiday') {
    const holidayName = getPublicHolidayName(bookingDate, countryCode);
    const loading = HOLIDAY_LOADING[countryCode];
    breakdown.push({
      label: `Public Holiday (${holidayName})`,
      value: `+${Math.round(loading * 100)}%`,
      multiplier: 1 + loading,
      isLoading: true,
    });
    recommendations.push(`This booking falls on ${holidayName}, a public holiday in ${COUNTRY_NAMES[countryCode]}. A ${Math.round(loading * 100)}% loading applies to all bookings on this day.`);
  } else if (dayType === 'saturday' || dayType === 'sunday') {
    const loading = WEEKEND_LOADING[countryCode];
    const dayName = dayType === 'saturday' ? 'Saturday' : 'Sunday';
    breakdown.push({
      label: `Weekend (${dayName})`,
      value: `+${Math.round(loading * 100)}%`,
      multiplier: 1 + loading,
      isLoading: true,
    });
    recommendations.push(`Weekend bookings in ${COUNTRY_NAMES[countryCode]} include a ${Math.round(loading * 100)}% loading. Consider booking on a weekday for better rates.`);
  }
  
  // Time of day multiplier
  if (timeSlot === 'evening' || timeSlot === 'night') {
    const multiplier = TIME_OF_DAY_MULTIPLIERS[countryCode][timeSlot];
    breakdown.push({
      label: `Time of Day (${timeSlot})`,
      value: `${multiplier}×`,
      multiplier,
      isLoading: true,
    });
    recommendations.push(`${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} bookings (${timeSlot === 'evening' ? '5PM-10PM' : '10PM-6AM'}) include a ${multiplier}× multiplier in ${COUNTRY_NAMES[countryCode]}.`);
  }
  
  // Calculate totals
  let totalMultiplier = 1.0;
  for (const item of breakdown) {
    if (item.multiplier && item.isLoading) {
      totalMultiplier = item.multiplier;
    }
  }
  
  const subtotal = hourlyRate * totalMultiplier * duration;
  const platformFee = subtotal * 0.15;
  const customerTotal = subtotal;
  
  // Add duration and total
  breakdown.push({
    label: 'Duration',
    value: `${duration} hour${duration > 1 ? 's' : ''}`,
  });
  
  breakdown.push({
    label: 'Subtotal',
    value: `${currencySymbol}${subtotal.toFixed(2)}`,
  });
  
  breakdown.push({
    label: 'Platform Fee (15%)',
    value: `${currencySymbol}${platformFee.toFixed(2)}`,
  });
  
  breakdown.push({
    label: 'Total',
    value: `${currencySymbol}${customerTotal.toFixed(2)}`,
  });
  
  // Generate summary
  const serviceName = SERVICE_CATEGORY_MAP[serviceId] || 'Service';
  let summary = `The total cost for ${serviceName} on `;
  
  const date = new Date(bookingDate);
  const dateStr = date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  
  if (dayType === 'public_holiday') {
    const holidayName = getPublicHolidayName(bookingDate, countryCode);
    summary += `${dateStr} (${holidayName}) is ${currencySymbol}${customerTotal.toFixed(2)}.`;
  } else if (dayType === 'saturday' || dayType === 'sunday') {
    const dayName = dayType === 'saturday' ? 'Saturday' : 'Sunday';
    summary += `${dateStr} (${dayName}) is ${currencySymbol}${customerTotal.toFixed(2)}.`;
  } else {
    summary += `${dateStr} is ${currencySymbol}${customerTotal.toFixed(2)}.`;
  }
  
  if (timeSlot === 'evening' || timeSlot === 'night') {
    summary += ` Evening/night rates apply.`;
  }
  
  return { summary, breakdown, recommendations };
}

// =====================================================
// TEMPLATE LITERALS FOR AI RESPONSES
// =====================================================

/**
 * Get template for explaining AU pricing rules
 */
export function getAUTemplate(): string {
  return `
## Australia Pricing Rules

### Base Rates (per hour)
- Cleaning: A$35–55
- Deep Cleaning: A$50–80
- Support Work: A$55–75
- Handyman: A$70–120

### Weekend Loading
- Saturday & Sunday: +20%

### Public Holiday Loading
- All public holidays: +150%

### Time of Day Multipliers
- Morning (6AM–12PM): 1.0×
- Afternoon (12PM–5PM): 1.0×
- Evening (5PM–10PM): 1.25×
- Night (10PM–6AM): 1.5×

### Platform Fee
- 15% of booking subtotal
`;
}

/**
 * Get template for explaining CA pricing rules
 */
export function getCATemplate(): string {
  return `
## Canada Pricing Rules

### Base Rates (per hour)
- Cleaning: C$25–40
- Deep Cleaning: C$40–60
- Support Work: C$28–45
- Handyman: C$60–100

### Weekend Loading
- Saturday & Sunday: +15%

### Public Holiday Loading
- All public holidays: +200%

### Time of Day Multipliers
- Morning (6AM–12PM): 1.0×
- Afternoon (12PM–5PM): 1.0×
- Evening (5PM–10PM): 1.2×
- Night (10PM–6AM): 1.4×

### Platform Fee
- 15% of booking subtotal
`;
}

/**
 * Get template for specific day type
 */
export function getDayTypeTemplate(countryCode: string, dayType: string, holidayName?: string): string {
  const country = COUNTRY_NAMES[countryCode];
  
  if (dayType === 'public_holiday' && holidayName) {
    return `This booking falls on ${holidayName}, a public holiday in ${country}, so a ${Math.round(HOLIDAY_LOADING[countryCode] * 100)}% loading applies.`;
  }
  
  if (dayType === 'saturday' || dayType === 'sunday') {
    return `Weekend bookings in ${country} include a ${Math.round(WEEKEND_LOADING[countryCode] * 100)}% loading.`;
  }
  
  return `This is a standard weekday rate in ${country}.`;
}

/**
 * Get template for time slot
 */
export function getTimeSlotTemplate(countryCode: string, timeSlot: string): string {
  const country = COUNTRY_NAMES[countryCode];
  const multiplier = TIME_OF_DAY_MULTIPLIERS[countryCode][timeSlot];
  
  if (multiplier === 1.0) {
    return `This booking falls during ${timeSlot} hours in ${country}, which is at the standard rate.`;
  }
  
  return `${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} bookings in ${country} include a ${multiplier}× multiplier.`;
}

/**
 * Format price breakdown for display
 */
export function formatBreakdownForDisplay(breakdown: PricingExplanationItem[]): string {
  const lines = breakdown.map(item => {
    const multiplier = item.multiplier && item.multiplier !== 1.0 ? ` (${item.value})` : '';
    return `- ${item.label}: ${item.value}${multiplier}`;
  });
  
  return lines.join('\n');
}

/**
 * Get quick price estimate
 */
export function getQuickEstimate(
  countryCode: 'AU' | 'CA',
  serviceId: string,
  dayType: string,
  timeSlot: string,
  duration: number
): { estimate: string; range: string } {
  const category = SERVICE_CATEGORY_KEY[serviceId] || 'cleaning';
  const baseRates = BASE_RATES[countryCode]?.[category];
  
  if (!baseRates) {
    return { estimate: 'Varies', range: 'Contact for pricing' };
  }
  
  // Calculate multiplier
  let multiplier = 1.0;
  
  if (dayType === 'public_holiday') {
    multiplier = HOLIDAY_LOADING[countryCode] + 1;
  } else if (dayType === 'saturday' || dayType === 'sunday') {
    multiplier = WEEKEND_LOADING[countryCode] + 1;
  }
  
  if (timeSlot === 'evening' || timeSlot === 'night') {
    multiplier *= TIME_OF_DAY_MULTIPLIERS[countryCode][timeSlot];
  }
  
  const minEstimate = baseRates.min * multiplier * duration;
  const maxEstimate = baseRates.max * multiplier * duration;
  const avgEstimate = (minEstimate + maxEstimate) / 2;
  
  const symbol = CURRENCY_SYMBOLS[countryCode];
  
  return {
    estimate: `${symbol}${avgEstimate.toFixed(0)}`,
    range: `${symbol}${minEstimate.toFixed(0)}–${symbol}${maxEstimate.toFixed(0)}`,
  };
}

// =====================================================
// RAG-AWARE RESPONSE GENERATOR
// =====================================================

/**
 * Generate a contextual pricing response for AI chat
 */
export function generatePricingResponse(
  input: PricingExplanationInput,
  userQuestion?: string
): string {
  const explanation = generatePricingExplanation(input);
  
  let response = explanation.summary + '\n\n';
  response += '### Price Breakdown\n';
  response += formatBreakdownForDisplay(explanation.breakdown) + '\n\n';
  
  if (explanation.recommendations.length > 0) {
    response += '### Tips\n';
    for (const rec of explanation.recommendations) {
      response += `- ${rec}\n`;
    }
  }
  
  // Answer specific user questions if provided
  if (userQuestion) {
    const lowerQuestion = userQuestion.toLowerCase();
    
    if (lowerQuestion.includes('weekend') || lowerQuestion.includes('saturday') || lowerQuestion.includes('sunday')) {
      const loading = WEEKEND_LOADING[input.countryCode];
      response += `\n**Weekend Pricing:** Weekend bookings in ${COUNTRY_NAMES[input.countryCode]} add a ${Math.round(loading * 100)}% loading to the base rate.`;
    }
    
    if (lowerQuestion.includes('holiday') || lowerQuestion.includes('public holiday')) {
      const loading = HOLIDAY_LOADING[input.countryCode];
      response += `\n**Holiday Pricing:** Public holidays in ${COUNTRY_NAMES[input.countryCode]} add a ${Math.round(loading * 100)}% loading to the base rate.`;
    }
    
    if (lowerQuestion.includes('evening') || lowerQuestion.includes('night') || lowerQuestion.includes('time')) {
      const timeSlot = getTimeSlot(input.bookingTime);
      const multiplier = TIME_OF_DAY_MULTIPLIERS[input.countryCode][timeSlot];
      if (multiplier > 1.0) {
        response += `\n**Time-of-Day Pricing:** ${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} bookings include a ${multiplier}× multiplier in ${COUNTRY_NAMES[input.countryCode]}.`;
      }
    }
    
    if (lowerQuestion.includes('cheaper') || lowerQuestion.includes('discount') || lowerQuestion.includes('save')) {
      response += `\n**Saving Tips:** 
- Book on weekdays for standard rates
- Avoid public holidays
- Schedule during morning (6AM–12PM) or afternoon (12PM–5PM) for best rates`;
    }
  }
  
  return response;
}