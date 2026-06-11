/**
 * PROXIMITY-BASED PROVIDER MATCHING & DYNAMIC PRICING
 * SilverConnect Global
 *
 * Core principle: closer provider = cheaper service (less travel cost)
 * Customer provides tools = cheaper (provider doesn't need to bring equipment)
 *
 * Distance tiers:
 *   Walking (< 2km):   -15% discount (provider walks, no transport cost)
 *   Cycling (2-5km):   -8% discount (low transport cost)
 *   Driving (5-15km):  base rate (standard)
 *   Far (15-30km):     +10% surcharge (fuel/time)
 *   Remote (30km+):    +20% surcharge (significant travel)
 *
 * Postcode/ZIP terminology by country:
 *   AU: Postcode (4 digits)
 *   CN: 邮政编码 (6 digits)
 *   CA: Postal Code (A1A 1A1)
 *   US: ZIP Code (5 digits or 5+4)
 *   TW: 郵遞區號 (3 digits)
 *   SG: Postal Code (6 digits)
 *   HK: N/A (use district)
 *   MY: Poskod (5 digits)
 */

export type CountryCode = "AU" | "CN" | "CA" | "US" | "TW" | "SG" | "HK" | "MY";

// ─── Postcode Label by Country ──────────────────────────────

export const POSTCODE_LABEL: Record<CountryCode, { en: string; local: string; format: string; example: string }> = {
  AU: { en: "Postcode", local: "Postcode", format: "4 digits", example: "6430" },
  CN: { en: "Postal Code", local: "邮政编码", format: "6 digits", example: "200001" },
  CA: { en: "Postal Code", local: "Code postal", format: "A1A 1A1", example: "V6B 1A1" },
  US: { en: "ZIP Code", local: "ZIP Code", format: "5 digits", example: "94105" },
  TW: { en: "Postal Code", local: "郵遞區號", format: "3 digits", example: "100" },
  SG: { en: "Postal Code", local: "Postal Code", format: "6 digits", example: "018956" },
  HK: { en: "District", local: "地區", format: "District name", example: "Central" },
  MY: { en: "Postcode", local: "Poskod", format: "5 digits", example: "50000" },
};

// ─── Distance Tiers ─────────────────────────────────────────

export type DistanceTier = "walking" | "cycling" | "driving" | "far" | "remote";

export interface DistanceInfo {
  tier: DistanceTier;
  distanceKm: number;
  estimatedTravelMin: number;
  discount: number; // negative = discount, positive = surcharge
  emoji: string;
  labelEn: string;
  labelZh: string;
}

const DISTANCE_TIERS: Record<DistanceTier, { maxKm: number; discount: number; travelSpeedKmh: number; emoji: string; labelEn: string; labelZh: string }> = {
  walking:  { maxKm: 2,   discount: -0.15, travelSpeedKmh: 5,  emoji: "🚶", labelEn: "Walking distance", labelZh: "步行距离" },
  cycling:  { maxKm: 5,   discount: -0.08, travelSpeedKmh: 15, emoji: "🚲", labelEn: "Cycling distance", labelZh: "骑行距离" },
  driving:  { maxKm: 15,  discount: 0,     travelSpeedKmh: 40, emoji: "🚗", labelEn: "Short drive", labelZh: "短程驾车" },
  far:      { maxKm: 30,  discount: 0.10,  travelSpeedKmh: 50, emoji: "🛣️", labelEn: "Far", labelZh: "较远" },
  remote:   { maxKm: 999, discount: 0.20,  travelSpeedKmh: 60, emoji: "✈️", labelEn: "Remote area", labelZh: "偏远地区" },
};

export function classifyDistance(km: number): DistanceInfo {
  for (const [tier, config] of Object.entries(DISTANCE_TIERS)) {
    if (km <= config.maxKm) {
      return {
        tier: tier as DistanceTier,
        distanceKm: km,
        estimatedTravelMin: Math.round((km / config.travelSpeedKmh) * 60),
        discount: config.discount,
        emoji: config.emoji,
        labelEn: config.labelEn,
        labelZh: config.labelZh,
      };
    }
  }
  // Fallback: remote
  const remote = DISTANCE_TIERS.remote;
  return {
    tier: "remote",
    distanceKm: km,
    estimatedTravelMin: Math.round((km / remote.travelSpeedKmh) * 60),
    discount: remote.discount,
    emoji: remote.emoji,
    labelEn: remote.labelEn,
    labelZh: remote.labelZh,
  };
}

// ─── Tool Provision Discount ────────────────────────────────

export type ToolProvision = "customer_provides" | "provider_brings" | "platform_supplies";

export interface ToolDiscount {
  type: ToolProvision;
  discount: number;
  labelEn: string;
  labelZh: string;
  descEn: string;
  descZh: string;
}

const TOOL_DISCOUNTS: Record<ToolProvision, ToolDiscount> = {
  customer_provides: {
    type: "customer_provides",
    discount: -0.12,
    labelEn: "I have my own tools",
    labelZh: "我提供工具",
    descEn: "You provide cleaning supplies, garden tools, etc. Provider brings expertise only.",
    descZh: "您提供清洁用品、园艺工具等。服务者只需带来专业技能。",
  },
  provider_brings: {
    type: "provider_brings",
    discount: 0,
    labelEn: "Provider brings tools",
    labelZh: "服务者带工具",
    descEn: "Provider brings all necessary equipment. Standard pricing.",
    descZh: "服务者携带所有必要设备。标准价格。",
  },
  platform_supplies: {
    type: "platform_supplies",
    discount: 0.05,
    labelEn: "Need supplies delivered",
    labelZh: "需要配送工具",
    descEn: "Platform arranges tool/supply delivery before the service. Small convenience fee.",
    descZh: "平台安排服务前的工具/用品配送。少量便利费。",
  },
};

export function getToolDiscount(provision: ToolProvision): ToolDiscount {
  return TOOL_DISCOUNTS[provision];
}

// ─── Tool Requirements by Service Category ──────────────────

export const SERVICE_TOOL_REQUIREMENTS: Record<string, { toolsEn: string[]; toolsZh: string[]; customerCanProvide: boolean }> = {
  cleaning: {
    toolsEn: ["Vacuum cleaner", "Mop & bucket", "Cleaning sprays", "Cloths/sponges", "Garbage bags"],
    toolsZh: ["吸尘器", "拖把和水桶", "清洁喷雾", "抹布/海绵", "垃圾袋"],
    customerCanProvide: true,
  },
  garden: {
    toolsEn: ["Lawn mower", "Hedge trimmer", "Rake", "Garden gloves", "Waste bags"],
    toolsZh: ["割草机", "修剪机", "耙子", "园艺手套", "垃圾袋"],
    customerCanProvide: true,
  },
  repair: {
    toolsEn: ["Basic tool kit", "Power drill", "Replacement parts", "Safety gear"],
    toolsZh: ["基本工具箱", "电钻", "替换零件", "安全装备"],
    customerCanProvide: true,
  },
  personalCare: {
    toolsEn: ["Hygiene supplies (provided by platform)", "Gloves", "First aid kit"],
    toolsZh: ["卫生用品（平台提供）", "手套", "急救箱"],
    customerCanProvide: false, // Hygiene items must be professional-grade
  },
  companion: {
    toolsEn: ["No tools required"],
    toolsZh: ["无需工具"],
    customerCanProvide: false, // N/A
  },
  transport: {
    toolsEn: ["Vehicle (provider's)", "Wheelchair ramp (if needed)"],
    toolsZh: ["车辆（服务者的）", "轮椅坡道（如需）"],
    customerCanProvide: false, // Provider must have vehicle
  },
};

// ─── Composite Pricing Engine ───────────────────────────────

export interface PricingFactors {
  baseHourlyRate: number;
  distanceKm: number;
  toolProvision: ToolProvision;
  serviceCategory: string;
  isRepeatCustomer: boolean;
  providerRating: number; // 1-5
  demandLevel: "low" | "normal" | "high"; // area demand
  timeOfDay: "peak" | "standard" | "offpeak";
  isWeekend: boolean;
}

export interface PriceBreakdown {
  baseRate: number;
  distanceAdjustment: number;     // +/- based on proximity
  toolAdjustment: number;         // - if customer provides
  loyaltyDiscount: number;        // - for repeat customers
  demandAdjustment: number;       // +/- based on supply/demand
  timeAdjustment: number;         // +/- peak/offpeak
  weekendSurcharge: number;       // + for weekends
  finalHourlyRate: number;
  platformFee: number;            // 15%
  providerEarnings: number;       // 85%
  savingsVsMarket: number;        // vs Jim's/industry average
  distanceInfo: DistanceInfo;
  toolInfo: ToolDiscount;
}

export function calculatePrice(factors: PricingFactors): PriceBreakdown {
  const { baseHourlyRate, distanceKm, toolProvision, serviceCategory, isRepeatCustomer, providerRating, demandLevel, timeOfDay, isWeekend } = factors;

  // 1. Distance adjustment
  const distanceInfo = classifyDistance(distanceKm);
  const distanceAdjustment = baseHourlyRate * distanceInfo.discount;

  // 2. Tool adjustment
  const toolInfo = getToolDiscount(toolProvision);
  const canUseToolDiscount = SERVICE_TOOL_REQUIREMENTS[serviceCategory]?.customerCanProvide ?? false;
  const toolAdjustment = (toolProvision === "customer_provides" && canUseToolDiscount)
    ? baseHourlyRate * toolInfo.discount
    : (toolProvision === "platform_supplies" ? baseHourlyRate * toolInfo.discount : 0);

  // 3. Loyalty discount (repeat customer)
  const loyaltyDiscount = isRepeatCustomer ? -(baseHourlyRate * 0.05) : 0;

  // 4. Demand adjustment
  const demandMultiplier = demandLevel === "high" ? 0.08 : demandLevel === "low" ? -0.05 : 0;
  const demandAdjustment = baseHourlyRate * demandMultiplier;

  // 5. Time of day adjustment
  const timeMultiplier = timeOfDay === "peak" ? 0.10 : timeOfDay === "offpeak" ? -0.08 : 0;
  const timeAdjustment = baseHourlyRate * timeMultiplier;

  // 6. Weekend surcharge
  const weekendSurcharge = isWeekend ? baseHourlyRate * 0.15 : 0;

  // Calculate final rate
  const rawFinal = baseHourlyRate + distanceAdjustment + toolAdjustment + loyaltyDiscount + demandAdjustment + timeAdjustment + weekendSurcharge;

  // Floor: provider must earn at least minimum wage equivalent
  const MIN_HOURLY: Record<string, number> = { AU: 24, CN: 15, CA: 17, US: 15, TW: 183, SG: 20, HK: 40, MY: 6 };
  const providerFloor = MIN_HOURLY["AU"] || 24; // Default to AU
  const finalHourlyRate = Math.max(rawFinal, providerFloor / 0.85); // Ensure provider gets at least min after platform cut

  // Platform split
  const platformFee = finalHourlyRate * 0.15;
  const providerEarnings = finalHourlyRate * 0.85;

  // Industry comparison (Jim's Cleaning ~$65/h)
  const industryAvg = baseHourlyRate * 1.3; // Industry typically 30% more
  const savingsVsMarket = Math.max(0, industryAvg - finalHourlyRate);

  return {
    baseRate: baseHourlyRate,
    distanceAdjustment: Math.round(distanceAdjustment * 100) / 100,
    toolAdjustment: Math.round(toolAdjustment * 100) / 100,
    loyaltyDiscount: Math.round(loyaltyDiscount * 100) / 100,
    demandAdjustment: Math.round(demandAdjustment * 100) / 100,
    timeAdjustment: Math.round(timeAdjustment * 100) / 100,
    weekendSurcharge: Math.round(weekendSurcharge * 100) / 100,
    finalHourlyRate: Math.round(finalHourlyRate * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    providerEarnings: Math.round(providerEarnings * 100) / 100,
    savingsVsMarket: Math.round(savingsVsMarket * 100) / 100,
    distanceInfo,
    toolInfo,
  };
}

// ─── Provider Matching by Postcode ──────────────────────────

export interface ProviderMatch {
  providerId: string;
  providerName: string;
  postcode: string;
  distanceKm: number;
  distanceInfo: DistanceInfo;
  rating: number;
  reviewCount: number;
  priceBreakdown: PriceBreakdown;
  availableToday: boolean;
  languages: string[];
  badges: string[];   // "verified", "tafe_certified", "first_aid", etc.
  matchScore: number; // 0-100 composite score
}

/**
 * Match score weights:
 * - 35% Proximity (closer = higher score)
 * - 25% Rating (higher = better)
 * - 20% Availability (available today = bonus)
 * - 10% Language match (speaks customer's language)
 * - 10% Certification (TAFE, first aid, etc.)
 */
export function calculateMatchScore(params: {
  distanceKm: number;
  rating: number;
  reviewCount: number;
  availableToday: boolean;
  languageMatch: boolean;
  hasCertification: boolean;
}): number {
  const { distanceKm, rating, reviewCount, availableToday, languageMatch, hasCertification } = params;

  // Proximity: 0km=100, 2km=85, 5km=70, 15km=40, 30km=10, 50km+=0
  const proximityScore = Math.max(0, 100 - (distanceKm * 3.3));

  // Rating: (rating/5) * 100, boosted by review count
  const ratingBase = (rating / 5) * 100;
  const reviewBoost = Math.min(10, reviewCount / 5); // Up to +10 for 50+ reviews
  const ratingScore = Math.min(100, ratingBase + reviewBoost);

  // Availability: binary
  const availScore = availableToday ? 100 : 30;

  // Language: binary
  const langScore = languageMatch ? 100 : 40;

  // Certification: binary
  const certScore = hasCertification ? 100 : 50;

  // Weighted composite
  const score = (
    proximityScore * 0.35 +
    ratingScore * 0.25 +
    availScore * 0.20 +
    langScore * 0.10 +
    certScore * 0.10
  );

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── Postcode Distance Estimation ───────────────────────────

/**
 * Approximate distance between two postcodes.
 * In production, this would call a geocoding API (Google Maps, Mapbox).
 * For MVP, we use postcode-prefix grouping:
 *   - Same postcode: ~1km (walking)
 *   - Adjacent postcodes (±1-2): ~3-5km
 *   - Same prefix group: ~8-15km
 *   - Different prefix: ~20-50km+
 */
export function estimatePostcodeDistance(
  customerPostcode: string,
  providerPostcode: string,
  country: CountryCode
): number {
  // Normalize
  const c = customerPostcode.replace(/\s/g, "").toUpperCase();
  const p = providerPostcode.replace(/\s/g, "").toUpperCase();

  if (c === p) return 0.8; // Same postcode area

  switch (country) {
    case "AU": {
      // AU postcodes: 4 digits. Same first 2 = same region (~10km), same first 3 = nearby (~4km)
      const cNum = parseInt(c, 10);
      const pNum = parseInt(p, 10);
      const diff = Math.abs(cNum - pNum);
      if (diff <= 1) return 1.5;
      if (diff <= 5) return 4;
      if (diff <= 20) return 10;
      if (diff <= 100) return 25;
      return 50;
    }
    case "CN": {
      // CN postcodes: 6 digits. First 2 = province, first 4 = city
      if (c.slice(0, 4) === p.slice(0, 4)) return 3;
      if (c.slice(0, 2) === p.slice(0, 2)) return 20;
      return 100; // Different province
    }
    case "CA": {
      // CA postal codes: A1A 1A1. First 3 (FSA) = area
      if (c.slice(0, 3) === p.slice(0, 3)) return 2;
      if (c[0] === p[0]) return 15;
      return 50;
    }
    case "US": {
      // US ZIP: 5 digits. First 3 = sectional center
      const cZ = parseInt(c.slice(0, 5), 10);
      const pZ = parseInt(p.slice(0, 5), 10);
      const diff = Math.abs(cZ - pZ);
      if (diff <= 2) return 2;
      if (diff <= 10) return 5;
      if (diff <= 50) return 15;
      return 40;
    }
    case "TW": {
      // TW: 3-digit postal code. Same = same district
      if (c.slice(0, 2) === p.slice(0, 2)) return 3;
      return 20;
    }
    case "SG": {
      // SG: 6 digits, tiny country. First 2 = sector
      if (c.slice(0, 2) === p.slice(0, 2)) return 2;
      return 8; // Max ~25km across island
    }
    case "HK": {
      // HK uses district names, not numeric postcodes
      if (c === p) return 1;
      return 8; // HK is small
    }
    case "MY": {
      // MY: 5 digits. First 2 = state/region
      const cN = parseInt(c, 10);
      const pN = parseInt(p, 10);
      const diff = Math.abs(cN - pN);
      if (diff <= 5) return 3;
      if (diff <= 50) return 12;
      return 30;
    }
    default:
      return 10; // Unknown country, assume moderate
  }
}

// ─── Sort Providers by Match Score ──────────────────────────

export function sortProvidersByProximity(
  providers: Array<{
    id: string;
    name: string;
    postcode: string;
    rating: number;
    reviewCount: number;
    availableToday: boolean;
    languages: string[];
    badges: string[];
  }>,
  customerPostcode: string,
  country: CountryCode,
  customerLanguage: string
): ProviderMatch[] {
  return providers
    .map((prov) => {
      const distanceKm = estimatePostcodeDistance(customerPostcode, prov.postcode, country);
      const distanceInfo = classifyDistance(distanceKm);
      const languageMatch = prov.languages.some(
        (l) => l.toLowerCase() === customerLanguage.toLowerCase()
      );
      const hasCertification = prov.badges.some((b) =>
        ["tafe_certified", "first_aid", "verified", "dementia_trained"].includes(b)
      );

      const matchScore = calculateMatchScore({
        distanceKm,
        rating: prov.rating,
        reviewCount: prov.reviewCount,
        availableToday: prov.availableToday,
        languageMatch,
        hasCertification,
      });

      // Calculate price for this provider
      const priceBreakdown = calculatePrice({
        baseHourlyRate: 49, // Default AU cleaning rate
        distanceKm,
        toolProvision: "provider_brings",
        serviceCategory: "cleaning",
        isRepeatCustomer: false,
        providerRating: prov.rating,
        demandLevel: "normal",
        timeOfDay: "standard",
        isWeekend: false,
      });

      return {
        providerId: prov.id,
        providerName: prov.name,
        postcode: prov.postcode,
        distanceKm,
        distanceInfo,
        rating: prov.rating,
        reviewCount: prov.reviewCount,
        priceBreakdown,
        availableToday: prov.availableToday,
        languages: prov.languages,
        badges: prov.badges,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Highest match first
}
