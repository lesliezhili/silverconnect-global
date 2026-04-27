// filepath: app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// ==================== RATINGS ====================

// GET /api/feedback?type=ratings&provider_id=xxx - Get ratings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'ratings';
  const providerId = searchParams.get('provider_id');
  const bookingId = searchParams.get('booking_id');
  const userId = searchParams.get('user_id');
  const status = searchParams.get('status');

  try {
    // RATINGS
    if (type === 'ratings') {
      let query = supabase.from('ratings').select('*');
      
      if (providerId) query = query.eq('provider_id', providerId);
      if (bookingId) query = query.eq('booking_id', bookingId);
      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      let averageRating = null;
      let totalRatings = 0;
      if (providerId && data && data.length > 0) {
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        averageRating = sum / data.length;
        totalRatings = data.length;
      }

      return NextResponse.json({ ratings: data, averageRating, totalRatings });
    }

    // DISPUTES
    if (type === 'disputes') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data: customer } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .eq('user_type', 'customer')
        .maybeSingle();

      const { data: provider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let query = supabase
        .from('disputes')
        .select(`*, booking:bookings(id, booking_date, booking_time, services:service_id(name), service_providers:provider_id(full_name))`)
        .order('created_at', { ascending: false });

      if (customer) query = query.eq('customer_id', user.id);
      else if (provider) query = query.eq('provider_id', provider.id);

      if (bookingId) query = query.eq('booking_id', bookingId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ disputes: data });
    }

    // SAFETY FLAGS
    if (type === 'safety') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      let query = supabase
        .from('safety_flags')
        .select(`*, booking:bookings(id, booking_date, user_id, provider_id)`)
        .order('created_at', { ascending: false });

      if (providerId) query = query.eq('provider_id', providerId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ flags: data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/feedback - Create rating, dispute, or safety flag
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'rating';

  const body = await request.json();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // CREATE RATING
    if (type === 'rating' || !type) {
      const { booking_id, provider_id, rating, review_text } = body;

      // Verify booking belongs to user
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, user_id, provider_id, status')
        .eq('id', booking_id)
        .maybeSingle();

      if (!booking || booking.user_id !== user.id) {
        return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
      }

      if (booking.status !== 'completed') {
        return NextResponse.json({ error: 'Can only rate completed bookings' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('ratings')
        .insert({
          user_id: user.id,
          booking_id,
          provider_id: provider_id || booking.provider_id,
          rating,
          review_text,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ rating: data });
    }

    // CREATE DISPUTE
    if (type === 'dispute') {
      const { booking_id, reason, description } = body;

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, user_id, provider_id')
        .eq('id', booking_id)
        .maybeSingle();

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const { data, error } = await supabase
        .from('disputes')
        .insert({
          booking_id,
          customer_id: booking.user_id,
          provider_id: booking.provider_id,
          reason,
          description,
          status: 'open',
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ dispute: data });
    }

    // CREATE SAFETY FLAG
    if (type === 'safety') {
      const { booking_id, flag_type, description, severity } = body;

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, user_id, provider_id')
        .eq('id', booking_id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('safety_flags')
        .insert({
          booking_id,
          reporter_id: user.id,
          provider_id: booking?.provider_id,
          flag_type,
          description,
          severity: severity || 'medium',
          status: 'open',
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ flag: data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/feedback - Update dispute or safety flag status
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dispute';

  const body = await request.json();
  const { id, status, resolution_notes } = body;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (type === 'dispute') {
      const { data, error } = await supabase
        .from('disputes')
        .update({ status, resolution_notes, resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ dispute: data });
    }

    if (type === 'safety') {
      const { data, error } = await supabase
        .from('safety_flags')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ flag: data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}