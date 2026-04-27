// filepath: app/api/provider/zones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/zones - Get provider zones
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const { data: zones, error } = await supabase
    .from('provider_zones')
    .select('*')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ zones: zones || [] });
}

// POST /api/provider/zones - Add zone
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { countryCode, city, postalCodeStart, postalCodeEnd, maxTravelRadiusKm } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('provider_zones')
      .insert({
        provider_id: provider.id,
        country_code: countryCode,
        city,
        postal_code_start: postalCodeStart,
        postal_code_end: postalCodeEnd || postalCodeStart,
        max_travel_radius_km: maxTravelRadiusKm || 20,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, zone: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/provider/zones - Update zone
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { zoneId, countryCode, city, postalCodeStart, postalCodeEnd, maxTravelRadiusKm } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('provider_zones')
      .update({
        country_code: countryCode,
        city,
        postal_code_start: postalCodeStart,
        postal_code_end: postalCodeEnd,
        max_travel_radius_km: maxTravelRadiusKm,
      })
      .eq('id', zoneId)
      .eq('provider_id', provider?.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, zone: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/provider/zones - Delete zone
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('id');

    if (!zoneId) return NextResponse.json({ error: "Zone ID required" }, { status: 400 });

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('provider_zones')
      .delete()
      .eq('id', zoneId)
      .eq('provider_id', provider?.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}