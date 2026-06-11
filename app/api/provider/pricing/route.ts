import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { getAuthSession } = await import("@/lib/auth/session");
    const session = await getAuthSession();
    if (!session?.userId) return NextResponse.json({ rates: {}, locationTier: "metro" });

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data } = await supabase
      .from("provider_profiles")
      .select("notes")
      .eq("user_id", session.userId)
      .single();

    let rates: Record<string, number> = {};
    let locationTier = "metro";
    if (data?.notes) {
      try {
        const parsed = JSON.parse(data.notes);
        if (parsed.smart_pricing) rates = parsed.smart_pricing;
        if (parsed.location_tier) locationTier = parsed.location_tier;
      } catch { /* plain text */ }
    }
    return NextResponse.json({ success: true, rates, locationTier });
  } catch {
    return NextResponse.json({ rates: {}, locationTier: "metro" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { getAuthSession } = await import("@/lib/auth/session");
    const session = await getAuthSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const rates = body.rates || {};
    const locationTier = body.locationTier || "metro";

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: existing } = await supabase
      .from("provider_profiles")
      .select("notes")
      .eq("user_id", session.userId)
      .single();

    let notesObj: Record<string, unknown> = {};
    if (existing?.notes) {
      try { notesObj = JSON.parse(existing.notes); } catch { notesObj = { text: existing.notes }; }
    }
    notesObj.smart_pricing = rates;
    notesObj.location_tier = locationTier;

    await supabase
      .from("provider_profiles")
      .update({ notes: JSON.stringify(notesObj) })
      .eq("user_id", session.userId);

    return NextResponse.json({ success: true, rates, locationTier });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
