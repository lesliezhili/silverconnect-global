import { NextRequest, NextResponse } from 'next/server';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { calculateServicePrice } from '@/lib/pricing';
import { checkAvailability } from '@/lib/availability';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const date = searchParams.get('date');

  let query = supabase
    .from('bookings')
    .select(`
      *,
      provider:provider_id (id, full_name, email, phone, profile_image, rating),
      service:service_id (id, name, name_zh, description, duration_minutes),
      customer:customer_id (id, full_name, email, phone)
    `);

  if (role === 'provider') {
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (provider) query = query.eq('provider_id', provider.id);
  } else {
    query = query.eq('customer_id', user.id);
  }

  if (status) query = query.eq('status', status);
  if (date) query = query.eq('booking_date', date);
  
  query = query.order('booking_date', { ascending: true }).order('start_time', { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { providerId, serviceId, bookingDate, startTime, duration, address, specialInstructions } = body;

  // Calculate end time
  const endDateTime = new Date(`${bookingDate}T${startTime}`);
  endDateTime.setMinutes(endDateTime.getMinutes() + duration);
  const endTime = endDateTime.toTimeString().slice(0, 5);

  // Check availability
  const isAvailable = await checkAvailability(providerId, bookingDate, startTime, endTime);
  if (!isAvailable) {
    return NextResponse.json({ error: "Time slot no longer available" }, { status: 409 });
  }

  // Get user profile for country
  const { data: userProfile } = await supabase
    .from('users')
    .select('country_code')
    .eq('id', user.id)
    .single();

  // Calculate pricing
  const pricing = await calculateServicePrice({
    serviceId,
    countryCode: userProfile?.country_code || 'AU',
    providerId,
    date: bookingDate,
    startTime,
    duration
  });

  // Generate booking number
  const bookingNumber = `SC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Create booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      provider_id: providerId,
      customer_id: user.id,
      service_id: serviceId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      address,
      special_instructions: specialInstructions,
      base_price: pricing.base_price,
      time_multiplier: pricing.time_multiplier,
      day_multiplier: pricing.day_multiplier,
      total_price: pricing.total_price,
      platform_fee_amount: pricing.platform_fee,
      provider_payout_amount: pricing.provider_payout,
      status: 'PENDING',
      payment_status: 'UNPAID'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notification for provider
  await supabase.from('notifications').insert({
    user_id: booking.provider?.user_id,
    type: 'new_booking',
    title: 'New Booking Request',
    message: `New booking request for ${bookingDate} at ${startTime}`,
    data: { bookingId: booking.id }
  });

  return NextResponse.json({ 
    success: true, 
    booking, 
    total_price: pricing.total_price 
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { bookingId, status, action } = body;

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, provider:provider_id(user_id), customer:customer_id(user_id)')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isProvider = booking.provider?.user_id === user.id;
  const isCustomer = booking.customer?.user_id === user.id;

  if (!isProvider && !isCustomer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let updateData: any = {};

  if (action === 'confirm' && isProvider && booking.status === 'PENDING') {
    updateData.status = 'CONFIRMED';
  } else if (action === 'cancel') {
    updateData.status = 'CANCELLED';
  } else if (action === 'complete' && isProvider && booking.status === 'CONFIRMED') {
    updateData.status = 'COMPLETED';
  } else if (status) {
    updateData.status = status;
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send notification
  await supabase.from('notifications').insert({
    user_id: isProvider ? booking.customer?.user_id : booking.provider?.user_id,
    type: 'booking_status_update',
    title: `Booking ${updateData.status}`,
    message: `Your booking ${booking.booking_number} has been ${updateData.status}`,
    data: { bookingId, status: updateData.status }
  });

  return NextResponse.json({ success: true });
}