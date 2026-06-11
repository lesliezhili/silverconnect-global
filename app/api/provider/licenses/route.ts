import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Licensed trade services that require verification before work
export const LICENSED_SERVICES = ["electrical", "plumber", "tree_cut"];

export interface LicenseDoc {
  serviceCode: string;
  licenseNumber: string;
  licenseType: string; // e.g. "electrician_license", "plumber_license", "arborist_cert"
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string; // ISO date
  status: "pending" | "verified" | "expired";
}

// GET: retrieve provider's license/insurance docs
export async function GET(req: NextRequest) {
  try {
    const { getAuthSession } = await import("@/lib/auth/session");
    const session = await getAuthSession();
    if (!session?.userId) return NextResponse.json({ licenses: [] });

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data } = await supabase
      .from("provider_profiles")
      .select("notes")
      .eq("user_id", session.userId)
      .single();

    let licenses: LicenseDoc[] = [];
    if (data?.notes) {
      try {
        const parsed = JSON.parse(data.notes);
        if (parsed.licenses) licenses = parsed.licenses;
      } catch { /* plain text */ }
    }
    return NextResponse.json({ success: true, licenses });
  } catch {
    return NextResponse.json({ licenses: [] });
  }
}

// POST: save provider's license/insurance details
export async function POST(req: NextRequest) {
  try {
    const { getAuthSession } = await import("@/lib/auth/session");
    const session = await getAuthSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const licenses: LicenseDoc[] = body.licenses || [];

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
    notesObj.licenses = licenses;

    await supabase
      .from("provider_profiles")
      .update({ notes: JSON.stringify(notesObj) })
      .eq("user_id", session.userId);

    return NextResponse.json({ success: true, licenses });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
