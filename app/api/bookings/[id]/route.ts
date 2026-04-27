// filepath: app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/[id] - Get single booking
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: booking, error } = await (await import('@/lib/supabase')).supabase
    .from('bookings')
    .select(`
      *,
      services (name, description, duration_minutes, category),
      service_providers (id, full_name, phone, rating, avatar_initials)
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Check ownership
  const isOwner = booking.user_id === user.id;
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isProvider = provider && booking.provider_id === provider.id;

  if (!isOwner && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookingDate, bookingTime, address, specialInstructions, status } = body;

  // Get current booking
  const { data: currentBooking, error: fetchError } = await (await import('@/lib/supabase')).supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentBooking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Check if user can modify
  const isOwner = currentBooking.user_id === user.id;
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isProvider = provider && currentBooking.provider_id === provider.id;

  if (!isOwner && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow certain updates based on status
  if (currentBooking.status !== 'PENDING' && currentBooking.status !== 'CONFIRMED') {
    return NextResponse.json({ error: "Cannot modify booking in current status" }, { status: 400 });
  }

  const updateData: any = {};
  if (bookingDate) updateData.booking_date = bookingDate;
  if (bookingTime) updateData.booking_time = bookingTime;
  if (address) updateData.address = address;
  if (specialInstructions !== undefined) updateData.special_instructions = specialInstructions;
  if (status && isProvider) updateData.status = status;

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ booking });
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reason = searchParams.get('reason') || 'Cancelled by user';

  // Get current booking
  const { data: booking, error: fetchError } = await (await import('@/lib/supabase')).supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Check ownership
  const isOwner = booking.user_id === user.id;
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isProvider = provider && booking.provider_id === provider.id;

  if (!isOwner && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update status to cancelled
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add to status history
  await supabaseAdmin
    .from('booking_status_history')
    .insert({ booking_id: id, status: 'CANCELLED', changed_by: user.id, reason });

  return NextResponse.json({ success: true });
}