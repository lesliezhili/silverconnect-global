// filepath: app/api/safety/flags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/safety/flags - Get safety flags
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('provider_id');
  const status = searchParams.get('status');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('safety_flags')
      .select(`
        *,
        booking:bookings(
          id,
          booking_date,
          user_id,
          provider_id
        )
      `)
      .order('created_at', { ascending: false });

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ flags: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/safety/flags - Report a safety concern
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      booking_id, 
      flag_type, 
      description,
      severity 
    } = body;

    if (!booking_id || !flag_type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, flag_type, description' },
        { status: 400 }
      );
    }

    // Validate flag_type
    const validTypes = [
      'safety_concern',
      'no_show',
      'inappropriate_behavior',
      'property_damage',
      'medical_emergency',
      'other'
    ];
    if (!validTypes.includes(flag_type)) {
      return NextResponse.json(
        { error: 'Invalid flag_type' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity' },
        { status: 400 }
      );
    }

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Determine if user is customer or provider
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

    let providerId = null;
    if (customer) {
      providerId = booking.provider_id;
    } else if (provider) {
      providerId = provider.id;
    }

    // Create safety flag
    const { data, error } = await supabase
      .from('safety_flags')
      .insert({
        booking_id,
        provider_id: providerId,
        flag_type,
        description,
        severity: severity || 'medium',
        reported_by: user.id,
        status: 'pending_review',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If critical severity, notify admin (in real app, send email/push)
    if (severity === 'critical') {
      // Log for admin notification
      console.log('CRITICAL SAFETY FLAG:', {
        flag_id: data.id,
        booking_id,
        flag_type,
        reported_by: user.id,
      });
    }

    return NextResponse.json({ flag: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/safety/flags - Update flag status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .eq('user_type', 'admin')
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Only admins can update safety flags' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flag_id, status, resolution_notes } = body;

    if (!flag_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: flag_id, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending_review', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('safety_flags')
      .update({
        status,
        resolution_notes: resolution_notes || null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        resolved_by: status === 'resolved' ? user.id : null,
      })
      .eq('id', flag_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ flag: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}