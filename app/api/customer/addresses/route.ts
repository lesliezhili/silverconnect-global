// filepath: app/api/customer/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/customer/addresses - Get customer addresses
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: addresses, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ addresses: addresses || [] });
}

// POST /api/customer/addresses - Add address
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { label, address, city, postalCode, countryCode, latitude, longitude, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .insert({
        user_id: user.id,
        label: label || 'Home',
        address,
        city,
        postal_code: postalCode,
        country_code: countryCode || 'AU',
        latitude,
        longitude,
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, address: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/customer/addresses - Update address
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { addressId, label, address, city, postalCode, countryCode, latitude, longitude, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .update({
        label,
        address,
        city,
        postal_code: postalCode,
        country_code: countryCode,
        latitude,
        longitude,
        is_default: isDefault,
      })
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, address: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/customer/addresses - Delete address
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) return NextResponse.json({ error: "Address ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}