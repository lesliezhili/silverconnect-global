// filepath: app/api/customer/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get customer profile from users table
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ profile: null });

  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    full_name,
    phone,
    country_code,
    city,
    address,
    postal_code,
    latitude,
    longitude,
    birth_date,
    emergency_contact_name,
    emergency_contact_phone,
    medical_notes,
    preferred_language,
    profile_image,
  } = body;

  // Check if user exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name,
        phone,
        country_code,
        city,
        address,
        postal_code,
        latitude,
        longitude,
        birth_date,
        emergency_contact_name,
        emergency_contact_phone,
        medical_notes,
        preferred_language,
        profile_image,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } else {
    // Create new - need admin client
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin access not configured" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        full_name,
        phone,
        country_code,
        city,
        address,
        postal_code,
        latitude,
        longitude,
        birth_date,
        emergency_contact_name,
        emergency_contact_phone,
        medical_notes,
        preferred_language,
        profile_image,
        user_type: "customer",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  }
}