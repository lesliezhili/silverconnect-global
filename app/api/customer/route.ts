// filepath: app/api/customer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// GET /api/customer - Get customer profile and preferences
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ profile: null, preferences: null });

  // Split profile and preferences
  const profile = {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone,
    country_code: data.country_code,
    city: data.city,
    address: data.address,
    postal_code: data.postal_code,
    latitude: data.latitude,
    longitude: data.longitude,
    birth_date: data.birth_date,
    profile_image: data.profile_image,
    user_type: data.user_type,
    created_at: data.created_at,
  };

  const preferences = {
    preferred_language: data.preferred_language,
    medical_notes: data.medical_notes,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_phone: data.emergency_contact_phone,
  };

  return NextResponse.json({ profile, preferences });
}

// POST /api/customer - Create/update customer profile
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
    // Update existing user
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
        user_type: "customer",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } else {
    // Create new user
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

// PUT /api/customer - Update customer preferences only
export async function PUT(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    preferred_language,
    medical_notes,
    emergency_contact_name,
    emergency_contact_phone,
  } = body;

  const { data, error } = await supabase
    .from("users")
    .update({
      preferred_language,
      medical_notes,
      emergency_contact_name,
      emergency_contact_phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ preferences: data });
}