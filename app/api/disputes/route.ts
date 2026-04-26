// filepath: app/api/disputes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/disputes - Get disputes (filtered by user role)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const bookingId = searchParams.get('booking_id');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
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
      .select(`
        *,
        booking:bookings(
          id,
          booking_date,
          booking_time,
          services:service_id(name),
          service_providers:provider_id(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by user role
    if (customer) {
      query = query.eq('customer_id', user.id);
    } else if (provider) {
      query = query.eq('provider_id', provider.id);
    }

    if (status) {
      query = query.eq('status', status);
    }
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ disputes: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/disputes - Create a new dispute
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      booking_id, 
      dispute_type, 
      description, 
      evidence_urls,
      requested_action 
    } = body;

    if (!booking_id || !dispute_type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, dispute_type, description' },
        { status: 400 }
      );
    }

    // Validate dispute_type
    const validTypes = [
      'service_quality',
      'no_show',
      'damage',
      'billing',
      'safety',
      'communication',
      'other'
    ];
    if (!validTypes.includes(dispute_type)) {
      return NextResponse.json(
        { error: 'Invalid dispute_type' },
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

    let customerId = null;
    let providerId = null;

    if (customer) {
      customerId = user.id;
      providerId = booking.provider_id;
    } else if (provider) {
      providerId = provider.id;
      customerId = booking.user_id;
    } else {
      return NextResponse.json(
        { error: 'Only customers and providers can create disputes' },
        { status: 403 }
      );
    }

    // Check for existing open dispute
    const { data: existing } = await supabase
      .from('disputes')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('status', 'open')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'An open dispute already exists for this booking' },
        { status: 400 }
      );
    }

    // Create dispute
    const { data, error } = await supabase
      .from('disputes')
      .insert({
        booking_id,
        customer_id: customerId,
        provider_id: providerId,
        dispute_type,
        description,
        evidence_urls: evidence_urls || [],
        requested_action: requested_action || 'refund',
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create safety flag if it's a safety-related dispute
    if (dispute_type === 'safety' || dispute_type === 'no_show') {
      await supabase
        .from('safety_flags')
        .insert({
          booking_id,
          flag_type: dispute_type === 'safety' ? 'safety_concern' : 'no_show',
          reported_by: user.id,
          description,
          status: 'pending_review',
        });
    }

    return NextResponse.json({ dispute: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/disputes - Update dispute status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (in real app, check role)
    const { data: adminUser } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .eq('user_type', 'admin')
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Only admins can update disputes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dispute_id, status, resolution_notes, resolution_amount } = body;

    if (!dispute_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: dispute_id, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['open', 'under_review', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('disputes')
      .update({
        status,
        resolution_notes: resolution_notes || null,
        resolution_amount: resolution_amount || null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        resolved_by: status === 'resolved' ? user.id : null,
      })
      .eq('id', dispute_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If resolved with refund, process refund
    if (status === 'resolved' && resolution_amount && resolution_amount > 0) {
      await supabase
        .from('payment_transactions')
        .update({ refund_status: 'pending' })
        .eq('booking_id', data.booking_id);
    }

    return NextResponse.json({ dispute: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}