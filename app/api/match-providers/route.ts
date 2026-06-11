export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  estimatePostcodeDistance,
  classifyDistance,
  calculatePrice,
  calculateMatchScore,
  type CountryCode,
  type ToolProvision,
} from "@/lib/matching/proximity-engine";

/**
 * POST /api/match-providers
 *
 * Matches closest service providers based on customer postcode.
 * Returns sorted by match score (proximity-weighted).
 *
 * Body: { postcode, country, serviceCategory, toolProvision, customerLanguage? }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      postcode,
      country = "AU",
      serviceCategory = "cleaning",
      toolProvision = "provider_brings",
      customerLanguage = "en",
      isRepeatCustomer = false,
      isWeekend = false,
      timeOfDay = "standard",
    } = body as {
      postcode: string;
      country: CountryCode;
      serviceCategory: string;
      toolProvision: ToolProvision;
      customerLanguage?: string;
      isRepeatCustomer?: boolean;
      isWeekend?: boolean;
      timeOfDay?: "peak" | "standard" | "offpeak";
    };

    if (!postcode?.trim()) {
      return NextResponse.json({ error: "Postcode required" }, { status: 400 });
    }

    // Fetch providers who offer this service category and are active
    const providerRows: any = await db.execute(sql`
      SELECT
        pp.id,
        pp.display_name,
        pp.postcode,
        pp.suburb,
        pp.languages,
        pp.badges,
        COALESCE(pp.avg_rating, 0) as rating,
        COALESCE(pp.review_count, 0) as review_count,
        COALESCE(pp.base_hourly_rate, 49) as base_hourly_rate,
        pp.available_today,
        pc.category_slug
      FROM provider_profiles pp
      JOIN provider_categories pc ON pc.provider_id = pp.id
      WHERE pc.category_slug = ${serviceCategory}
        AND pp.is_active = true
        AND pp.is_verified = true
      ORDER BY pp.avg_rating DESC
      LIMIT 50
    `);

    const providers = (providerRows.rows || []) as any[];

    // Calculate distance and score for each provider
    const results = providers
      .map((prov: any) => {
        const provPostcode = prov.postcode || "";
        const distanceKm = estimatePostcodeDistance(postcode, provPostcode, country as CountryCode);
        const distanceInfo = classifyDistance(distanceKm);

        // Calculate price with all factors
        const priceBreakdown = calculatePrice({
          baseHourlyRate: Number(prov.base_hourly_rate) || 49,
          distanceKm,
          toolProvision: toolProvision as ToolProvision,
          serviceCategory,
          isRepeatCustomer,
          providerRating: Number(prov.rating) || 4,
          demandLevel: "normal",
          timeOfDay,
          isWeekend,
        });

        // Language match
        const provLanguages: string[] = Array.isArray(prov.languages) ? prov.languages : [];
        const languageMatch = provLanguages.some(
          (l: string) => l.toLowerCase().includes(customerLanguage.toLowerCase())
        );

        // Certification check
        const provBadges: string[] = Array.isArray(prov.badges) ? prov.badges : [];
        const hasCertification = provBadges.some((b: string) =>
          ["tafe_certified", "first_aid", "verified", "dementia_trained"].includes(b)
        );

        const matchScore = calculateMatchScore({
          distanceKm,
          rating: Number(prov.rating) || 4,
          reviewCount: Number(prov.review_count) || 0,
          availableToday: Boolean(prov.available_today),
          languageMatch,
          hasCertification,
        });

        // Industry comparison (Jim's Cleaning AU = ~$65/h)
        const industryAvg = (Number(prov.base_hourly_rate) || 49) * 1.3;
        const savings = Math.max(0, industryAvg - priceBreakdown.finalHourlyRate);

        return {
          id: prov.id,
          name: prov.display_name || "Provider",
          postcode: provPostcode,
          suburb: prov.suburb || "",
          distanceTier: distanceInfo.tier,
          distanceKm: Math.round(distanceInfo.distanceKm * 10) / 10,
          travelMin: distanceInfo.estimatedTravelMin,
          rating: Number(prov.rating) || 4,
          reviewCount: Number(prov.review_count) || 0,
          matchScore,
          finalRate: priceBreakdown.finalHourlyRate,
          baseRate: priceBreakdown.baseRate,
          savings: Math.round(savings * 100) / 100,
          languages: provLanguages,
          badges: provBadges,
          availableToday: Boolean(prov.available_today),
          priceBreakdown: {
            distanceDiscount: priceBreakdown.distanceAdjustment,
            toolDiscount: priceBreakdown.toolAdjustment,
            loyaltyDiscount: priceBreakdown.loyaltyDiscount,
            demandAdjustment: priceBreakdown.demandAdjustment,
            timeAdjustment: priceBreakdown.timeAdjustment,
            weekendSurcharge: priceBreakdown.weekendSurcharge,
            platformFee: priceBreakdown.platformFee,
            providerEarnings: priceBreakdown.providerEarnings,
          },
        };
      })
      // Filter out truly remote providers (50km+)
      .filter((p: any) => p.distanceKm <= 50)
      // Sort by match score (proximity is 35% of score)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 20); // Return top 20

    return NextResponse.json({
      providers: results,
      searchPostcode: postcode,
      country,
      serviceCategory,
      toolProvision,
      totalFound: results.length,
      pricingNote: toolProvision === "customer_provides"
        ? "12% discount applied — you provide tools"
        : toolProvision === "platform_supplies"
        ? "5% convenience fee — supplies delivered"
        : "Standard pricing — provider brings tools",
    });
  } catch (error) {
    console.error("[match-providers] Error:", error);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }
}
