// Smart Price — Market rate recommendations per service type
// With Location Tier (income-based) and Calendar Surcharges (penalty rates)

export interface SmartPrice {
  code: string;
  category: string;
  en: string;
  zh: string;
  marketRate: number;  // base AUD/hr (weekday, daytime, metro)
  minRate: number;
  maxRate: number;
  source: string;
}

// ─── LOCATION TIERS (income-based) ─────────────────────────────────────
// Adjusts base rate by area median household income
export interface LocationTier {
  code: string;
  en: string;
  zh: string;
  multiplier: number;
  description: string;
}

export const LOCATION_TIERS: LocationTier[] = [
  { code: "metro_high", en: "Metro – High Income", zh: "都市高收入区", multiplier: 1.20, description: "Inner city / affluent suburbs (median $130k+)" },
  { code: "metro", en: "Metro – Standard", zh: "都市标准区", multiplier: 1.00, description: "Standard metro suburbs (median $90-130k)" },
  { code: "regional", en: "Regional", zh: "区域城镇", multiplier: 0.85, description: "Regional towns (median $70-90k)" },
  { code: "remote", en: "Remote / Rural", zh: "偏远地区", multiplier: 1.15, description: "Remote areas – travel premium (median <$70k)" },
];

// ─── CALENDAR SURCHARGES (penalty rates per Fair Work Act) ─────────────
// Based on Australian penalty rate standards for home/community care workers
export interface CalendarRate {
  code: string;
  en: string;
  zh: string;
  multiplier: number;
  hours?: string;      // applicable hours
  law: string;         // legal reference
}

export const CALENDAR_RATES: CalendarRate[] = [
  { code: "weekday_day", en: "Weekday (6am–8pm)", zh: "工作日白天", multiplier: 1.00, hours: "Mon-Fri 6:00-20:00", law: "Base rate" },
  { code: "weekday_evening", en: "Weekday Evening (8pm–12am)", zh: "工作日晚间", multiplier: 1.15, hours: "Mon-Fri 20:00-00:00", law: "Fair Work – Evening penalty 15%" },
  { code: "weekday_night", en: "Night Shift (12am–6am)", zh: "夜班", multiplier: 1.25, hours: "Any day 00:00-06:00", law: "Fair Work – Night shift 25%" },
  { code: "saturday", en: "Saturday", zh: "周六", multiplier: 1.50, hours: "Sat all day", law: "SCHADS Award cl.26.1 – 150%" },
  { code: "sunday", en: "Sunday", zh: "周日", multiplier: 1.75, hours: "Sun all day", law: "SCHADS Award cl.26.2 – 175%" },
  { code: "public_holiday", en: "Public Holiday", zh: "公共假日", multiplier: 2.25, hours: "Gazetted public holidays", law: "SCHADS Award cl.34 – 225%" },
];

// ─── Country-specific calendar rules ──────────────────────────────────
export const COUNTRY_CALENDAR: Record<string, { weekendDays: number[]; nightStart: number; nightEnd: number; eveningStart: number }> = {
  au: { weekendDays: [0, 6], nightStart: 0, nightEnd: 6, eveningStart: 20 },  // Sun=0, Sat=6
  cn: { weekendDays: [0, 6], nightStart: 22, nightEnd: 6, eveningStart: 20 }, // China Labor Law Art.44
  ca: { weekendDays: [0, 6], nightStart: 0, nightEnd: 6, eveningStart: 20 },  // Ontario ESA
};

// China-specific penalty rates (Labor Law Art.44)
export const CN_CALENDAR_RATES: CalendarRate[] = [
  { code: "weekday_day", en: "Weekday Day", zh: "工作日白天", multiplier: 1.00, law: "Base rate" },
  { code: "weekday_overtime", en: "Weekday Overtime", zh: "工作日加班", multiplier: 1.50, law: "劳动法第44条 – 150%" },
  { code: "weekend", en: "Weekend", zh: "周末", multiplier: 2.00, law: "劳动法第44条 – 200%" },
  { code: "public_holiday", en: "Public Holiday", zh: "法定假日", multiplier: 3.00, law: "劳动法第44条 – 300%" },
];

// Canada Ontario-specific
export const CA_CALENDAR_RATES: CalendarRate[] = [
  { code: "weekday_day", en: "Weekday Day", zh: "工作日白天", multiplier: 1.00, law: "Base rate" },
  { code: "sunday_premium", en: "Sunday Premium", zh: "周日", multiplier: 1.50, law: "Ontario ESA s.24 – 1.5x" },
  { code: "public_holiday", en: "Public Holiday", zh: "法定假日", multiplier: 1.50, law: "Ontario ESA s.24 – 1.5x" },
  { code: "overtime", en: "Overtime (>44hr/wk)", zh: "加班", multiplier: 1.50, law: "Ontario ESA s.22 – 1.5x after 44hr" },
];

// ─── SERVICE RATES (base weekday/daytime/metro) ────────────────────────
export const SMART_PRICES: SmartPrice[] = [
  // Cleaning (ref: Jim's Cleaning, Absolute Domestics, Airtasker 2025-2026)
  { code: "regular", category: "cleaning", en: "Regular Clean", zh: "日常清洁", marketRate: 40, minRate: 30, maxRate: 55, source: "Jim's Cleaning standard" },
  { code: "medium", category: "cleaning", en: "Medium Clean", zh: "中度清洁", marketRate: 50, minRate: 40, maxRate: 65, source: "Jim's Cleaning spring" },
  { code: "deep", category: "cleaning", en: "Deep Clean", zh: "深度清洁", marketRate: 65, minRate: 50, maxRate: 85, source: "Jim's Cleaning deep" },
  { code: "external", category: "cleaning", en: "External Clean", zh: "外部清洁", marketRate: 55, minRate: 40, maxRate: 75, source: "Airtasker pressure wash" },
  { code: "gutter", category: "cleaning", en: "Gutter Clean", zh: "排水沟清洁", marketRate: 60, minRate: 45, maxRate: 80, source: "Gutter-Vac avg metro" },
  // Repairs & Renovation (ref: hipages, ServiceSeeking, Airtasker 2025-2026)
  { code: "electrical", category: "repair", en: "Electrical", zh: "电路", marketRate: 85, minRate: 65, maxRate: 120, source: "Licensed electrician avg" },
  { code: "plumber", category: "repair", en: "Plumbing", zh: "水管", marketRate: 90, minRate: 70, maxRate: 130, source: "Licensed plumber avg" },
  { code: "window", category: "repair", en: "Window", zh: "窗户", marketRate: 55, minRate: 40, maxRate: 75, source: "hipages window repair" },
  { code: "floor", category: "repair", en: "Floor", zh: "地板", marketRate: 60, minRate: 45, maxRate: 85, source: "hipages flooring avg" },
  { code: "door", category: "repair", en: "Door", zh: "门", marketRate: 55, minRate: 40, maxRate: 75, source: "ServiceSeeking door repair" },
  { code: "curtain", category: "repair", en: "Curtain", zh: "窗帘", marketRate: 45, minRate: 35, maxRate: 65, source: "Airtasker curtain install" },
  { code: "tree_cut", category: "repair", en: "Tree Cut", zh: "砍树修剪", marketRate: 75, minRate: 55, maxRate: 110, source: "hipages arborist avg" },
  // Garden
  { code: "garden_general", category: "garden", en: "Garden & Lawn", zh: "园艺", marketRate: 50, minRate: 35, maxRate: 70, source: "Jim's Mowing avg" },
  // Personal Care (NDIS price guide)
  { code: "personal_care", category: "personalCare", en: "Personal Care", zh: "护理", marketRate: 55, minRate: 45, maxRate: 75, source: "NDIS standard rate" },
  // Companion
  { code: "companion", category: "companion", en: "Companion Visit", zh: "陪伴", marketRate: 40, minRate: 30, maxRate: 55, source: "Home care pkg level 1" },
  // Transport
  { code: "transport", category: "transport", en: "Transport", zh: "接送", marketRate: 45, minRate: 35, maxRate: 60, source: "Community transport avg" },
  // IT
  { code: "it_support", category: "itSupport", en: "IT Help", zh: "电脑培训", marketRate: 65, minRate: 50, maxRate: 90, source: "Geeks2U standard rate" },
];

// ─── PRICING ENGINE ────────────────────────────────────────────────────

export function getSmartPrice(category: string, subtype?: string): SmartPrice | undefined {
  if (subtype) return SMART_PRICES.find(p => p.code === subtype && p.category === category);
  return SMART_PRICES.find(p => p.category === category);
}

// Determine calendar multiplier based on scheduled time + country
export function getCalendarMultiplier(scheduledAt: Date, country: string = "au"): { multiplier: number; label: string; law: string } {
  const day = scheduledAt.getDay(); // 0=Sun, 6=Sat
  const hour = scheduledAt.getHours();
  const rules = COUNTRY_CALENDAR[country] || COUNTRY_CALENDAR.au;

  // Public holidays checked externally (pass isHoliday flag)
  // Here we handle day-of-week and time-of-day

  if (country === "au") {
    if (day === 0) return { multiplier: 1.75, label: "Sunday", law: "SCHADS cl.26.2" };
    if (day === 6) return { multiplier: 1.50, label: "Saturday", law: "SCHADS cl.26.1" };
    if (hour >= 0 && hour < rules.nightEnd) return { multiplier: 1.25, label: "Night", law: "Fair Work night 25%" };
    if (hour >= rules.eveningStart) return { multiplier: 1.15, label: "Evening", law: "Fair Work evening 15%" };
    return { multiplier: 1.00, label: "Weekday", law: "Base rate" };
  }

  if (country === "cn") {
    if (day === 0 || day === 6) return { multiplier: 2.00, label: "Weekend", law: "劳动法Art.44 200%" };
    return { multiplier: 1.00, label: "Weekday", law: "Base rate" };
  }

  if (country === "ca") {
    if (day === 0) return { multiplier: 1.50, label: "Sunday", law: "Ontario ESA s.24" };
    return { multiplier: 1.00, label: "Weekday", law: "Base rate" };
  }

  return { multiplier: 1.00, label: "Standard", law: "Base rate" };
}

// Get location multiplier
export function getLocationMultiplier(locationTier: string = "metro"): number {
  const tier = LOCATION_TIERS.find(t => t.code === locationTier);
  return tier?.multiplier || 1.0;
}

// Full effective rate calculation
export function getEffectiveRate(
  category: string,
  subtype: string | undefined,
  options?: {
    providerOverride?: number;
    locationTier?: string;
    scheduledAt?: Date;
    country?: string;
    isPublicHoliday?: boolean;
  }
): { rate: number; baseRate: number; locationMultiplier: number; calendarMultiplier: number; calendarLabel: string; calendarLaw: string } {
  const smart = getSmartPrice(category, subtype);
  const baseRate = options?.providerOverride
    ? Math.max(smart?.minRate || 30, Math.min(smart?.maxRate || 130, options.providerOverride))
    : (smart?.marketRate || 45);

  const locationMultiplier = getLocationMultiplier(options?.locationTier);

  let calendarMultiplier = 1.0;
  let calendarLabel = "Weekday";
  let calendarLaw = "Base rate";

  if (options?.isPublicHoliday) {
    const country = options?.country || "au";
    if (country === "au") { calendarMultiplier = 2.25; calendarLabel = "Public Holiday"; calendarLaw = "SCHADS cl.34 225%"; }
    else if (country === "cn") { calendarMultiplier = 3.00; calendarLabel = "Public Holiday"; calendarLaw = "劳动法Art.44 300%"; }
    else if (country === "ca") { calendarMultiplier = 1.50; calendarLabel = "Public Holiday"; calendarLaw = "Ontario ESA 150%"; }
  } else if (options?.scheduledAt) {
    const cal = getCalendarMultiplier(options.scheduledAt, options.country);
    calendarMultiplier = cal.multiplier;
    calendarLabel = cal.label;
    calendarLaw = cal.law;
  }

  const rate = Math.round(baseRate * locationMultiplier * calendarMultiplier * 100) / 100;

  return { rate, baseRate, locationMultiplier, calendarMultiplier, calendarLabel, calendarLaw };
}
