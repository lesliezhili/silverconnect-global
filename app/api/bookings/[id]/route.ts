import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerUserFromRequest } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getServerUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: booking, error } = await supabaseAdmin!
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Check if user is customer or provider
  const { data: customer } = await supabaseAdmin!
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: provider } = await supabaseAdmin!
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if ((customer && booking.customer_id === customer.id) || (provider && booking.provider_id === provider.id)) {
    return NextResponse.json({ booking });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getServerUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { status } = body;

  if (!status || !['cancelled', 'completed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: booking, error: fetchError } = await supabaseAdmin!
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Check permissions
  const { data: customer } = await supabaseAdmin!
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: provider } = await supabaseAdmin!
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const isCustomer = customer && booking.customer_id === customer.id;
  const isProvider = provider && booking.provider_id === provider.id;

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (status === 'cancelled' && !isCustomer) {
    return NextResponse.json({ error: 'Only customers can cancel' }, { status: 403 });
  }

  if (status === 'completed' && !isProvider) {
    return NextResponse.json({ error: 'Only providers can complete' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin!
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking: data });
}
  }

  if (booking.customer_id !== user.id && booking.provider_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin
    .from('booking_status_history')
    .insert({ booking_id: id, status: 'CANCELLED', changed_by: user.id, reason: 'User cancelled booking' })

  return NextResponse.json({ success: true })
}
