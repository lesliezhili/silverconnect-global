// filepath: app/api/customer/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get customer preferences from users table
  const { data, error } = await supabase
    .from("users")
    .select("preferred_language, medical_notes, emergency_contact_name, emergency_contact_phone")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ preferences: data || {} });
}

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
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ preferences: data });
}