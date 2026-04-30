// filepath: app/api/provider/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { calculatePrice, calculatePriceSync, BASE_RATES, WEEKEND_LOADING, HOLIDAY_LOADING, TIME_OF_DAY_MULTIPLIERS } from '@/lib/pricing';

// GET /api/provider/pricing - Get provider's custom pricing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('provider_id');
  const serviceId = searchParams.get('service_id');
  const countryCode = searchParams.get('country_code') || 'AU';

  if (!providerId) {
    return NextResponse.json({ error: 'provider_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('provider_pricing')
      .select('*, services(id, name, category)')
      .eq('provider_id', providerId);

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no custom pricing, return default rates
    if (!data || data.length === 0) {
      const defaultPricing = Object.entries(BASE_RATES[countryCode] || BASE_RATES['AU']).map(([category, rates]) => ({
        service_id: category,
        custom_price: null,
        is_active: true,
        country_code: countryCode,
        default_price: (rates.min + rates.max) / 2,
        min_price: rates.min,
        max_price: rates.max,
      }));
      return NextResponse.json({ pricing: defaultPricing, is_default: true });
    }

    return NextResponse.json({ pricing: data, is_default: false });
  } catch (error) {
    console.error('Error fetching provider pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/pricing - Set provider's custom pricing
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get provider ID
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { pricing, country_code = 'AU' } = body;

    if (!pricing || !Array.isArray(pricing)) {
      return NextResponse.json({ error: 'pricing array is required' }, { status: 400 });
    }

    // Upsert pricing records
    const records = pricing.map((p: { service_id: string; custom_price: number; is_active?: boolean }) => ({
      provider_id: provider.id,
      service_id: p.service_id,
      custom_price: p.custom_price,
      country_code,
      is_active: p.is_active ?? true,
    }));

    // Delete existing and insert new
    await supabaseAdmin
      .from('provider_pricing')
      .delete()
      .eq('provider_id', provider.id)
      .eq('country_code', country_code);

    const { data, error } = await supabaseAdmin
      .from('provider_pricing')
      .insert(records)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pricing: data });
  } catch (error) {
    console.error('Error setting provider pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/provider/pricing - Update a specific pricing entry
export async function PATCH(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pricing_id, custom_price, is_active } = body;

    if (!pricing_id) {
      return NextResponse.json({ error: 'pricing_id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (custom_price !== undefined) updates.custom_price = custom_price;
    if (is_active !== undefined) updates.is_active = is_active;

    const { error } = await supabaseAdmin
      .from('provider_pricing')
      .update(updates)
      .eq('id', pricing_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating provider pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/provider/pricing - Remove custom pricing
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pricingId = searchParams.get('pricing_id');
    const providerId = searchParams.get('provider_id');

    if (!pricingId && !providerId) {
      return NextResponse.json({ error: 'pricing_id or provider_id is required' }, { status: 400 });
    }

    if (pricingId) {
      const { error } = await supabaseAdmin
        .from('provider_pricing')
        .delete()
        .eq('id', pricingId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (providerId) {
      const { error } = await supabaseAdmin
        .from('provider_pricing')
        .delete()
        .eq('provider_id', providerId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}