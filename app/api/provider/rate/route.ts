import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/provider/rate?providerId=xxx&service=cleaning
 * Returns the provider's custom rate for a service (if set).
 * Public endpoint — customer uses this to see provider's price.
 * 
 * Response: { hasCustomRate: boolean, rate: number, locationTier: string, providerName: string }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");
    const service = searchParams.get("service"); // e.g., "cleaning", "electrical", "deep"

    if (!providerId) {
      return NextResponse.json({ hasCustomRate: false, rate: 0 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data } = await supabase
      .from("provider_profiles")
      .select("notes, user_id")
      .eq("user_id", providerId)
      .single();

    if (!data?.notes) {
      return NextResponse.json({ hasCustomRate: false, rate: 0 });
    }

    // Get provider name
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", providerId)
      .single();

    let rates: Record<string, number> = {};
    let locationTier = "metro";
    try {
      const parsed = JSON.parse(data.notes);
      if (parsed.smart_pricing) rates = parsed.smart_pricing;
      if (parsed.location_tier) locationTier = parsed.location_tier;
    } catch { /* not JSON */ }

    // Check if provider has a custom rate for this service
    const customRate = service ? rates[service] : undefined;

    return NextResponse.json({
      hasCustomRate: !!customRate,
      rate: customRate || 0,
      locationTier,
      providerName: user?.name || "Provider",
      allRates: rates, // return all so customer can see category-level
    });
  } catch {
    return NextResponse.json({ hasCustomRate: false, rate: 0 });
  }
}
