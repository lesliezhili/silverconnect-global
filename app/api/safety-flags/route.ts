// filepath: app/api/safety-flags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/safety-flags - Get safety flags
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('booking_id');
  const providerId = searchParams.get('provider_id');
  const status = searchParams.get('status');

  let query = (await import('@/lib/supabase')).supabase
    .from('safety_flags')
    .select('*');

  if (bookingId) query = query.eq('booking_id', bookingId);
  if (providerId) query = query.eq('provider_id', providerId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ flags: data || [] });
}

// POST /api/safety-flags - Create safety flag
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bookingId, providerId, flagType, description, severity } = body;

    if (!flagType || !description) {
      return NextResponse.json({ error: "Flag type and description required" }, { status: 400 });
    }

    // Verify user has permission (either owns the booking or is the provider)
    if (bookingId) {
      const { data: booking } = await (await import('@/lib/supabase')).supabase
        .from('bookings')
        .select('user_id, provider_id')
        .eq('id', bookingId)
        .single();

      if (!booking || (booking.user_id !== user.id && booking.provider_id !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('safety_flags')
      .insert({
        booking_id: bookingId,
        provider_id: providerId,
        flag_type: flagType,
        description,
        severity: severity || 'medium',
        status: 'open',
        reported_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, flag: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/safety-flags - Update safety flag (admin)
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await (await import('@/lib/supabase')).supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('safety_flags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, flag: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}