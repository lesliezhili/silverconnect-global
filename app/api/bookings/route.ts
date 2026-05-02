import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerUserFromRequest } from '@/lib/supabase';
import { calculatePricing } from '@/lib/pricing';
import { getAvailableSlots } from '@/lib/availability';

export async function GET(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get('role') || 'customer';

  let query = supabaseAdmin!
    .from('bookings')
    .select('*')
    .order('start_datetime', { ascending: false });

  if (role === 'provider') {
    // Get provider id for user
    const { data: provider } = await supabaseAdmin!
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (provider) {
      query = query.eq('provider_id', provider.id);
    }
  } else {
    // Get customer id for user
    const { data: customer } = await supabaseAdmin!
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customer) {
      query = query.eq('customer_id', customer.id);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data });
}

export async function POST(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    provider_id,
    service_type,
    start_datetime,
    duration_minutes,
    country_code,
  } = body;

  if (!provider_id || !service_type || !start_datetime || !duration_minutes || !country_code) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get customer
  const { data: customer, error: customerError } = await supabaseAdmin!
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
  }

  // Get provider
  const { data: provider, error: providerError } = await supabaseAdmin!
    .from('service_providers')
    .select('*')
    .eq('id', provider_id)
    .single();

  if (providerError || !provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const startDate = new Date(start_datetime);
  const date = startDate.toISOString().split('T')[0];
  const startTime = startDate.toTimeString().slice(0, 5);
  const endDateTime = new Date(startDate.getTime() + duration_minutes * 60000);
  const endTime = endDateTime.toTimeString().slice(0, 5);

  // Check availability
  const availableSlots = await getAvailableSlots(provider_id, date, duration_minutes, country_code);
  const isAvailable = availableSlots.some(slot => slot.start_time === startTime && slot.end_time === endTime);

  if (!isAvailable) {
    return NextResponse.json({ error: 'Time slot not available' }, { status: 409 });
  }

  // Determine if weekend/holiday
  const dayOfWeek = startDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const { data: holiday } = await supabaseAdmin!
    .from('public_holidays')
    .select('id')
    .eq('country_code', country_code)
    .eq('date', date)
    .maybeSingle();

  const isHoliday = Boolean(holiday);

  // Get time of day multiplier
  const hour = startDate.getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';
  else if (hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const timeOfDayMultiplier = provider.time_of_day_multipliers[timeOfDay];

  // Calculate pricing
  const pricing = calculatePricing({
    country_code: country_code as 'AU' | 'CA' | 'US' | 'CN',
    service_type,
    base_rate: provider.base_rate,
    weekend_loading: provider.weekend_loading,
    holiday_loading: provider.holiday_loading,
    time_of_day_multiplier: timeOfDayMultiplier,
    duration_minutes,
    platform_fee_rate: 0.1, // Assume 10%
    currency: provider.country_code === 'AU' ? 'AUD' : provider.country_code === 'CA' ? 'CAD' : provider.country_code === 'US' ? 'USD' : 'CNY',
    is_weekend: isWeekend,
    is_holiday: isHoliday,
  });

  // Create booking
  const bookingPayload = {
    customer_id: customer.id,
    provider_id,
    service_type,
    country_code,
    start_datetime,
    duration_minutes,
    end_datetime: endDateTime.toISOString(),
    price_customer: pricing.customer_total,
    payout_provider: pricing.provider_payout,
    platform_fee: pricing.platform_fee,
    currency: pricing.breakdown.base > 0 ? 'AUD' : 'USD', // Placeholder
    status: 'pending',
  };

  const { data: booking, error: bookingError } = await supabaseAdmin!
    .from('bookings')
    .insert(bookingPayload)
    .select()
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  return NextResponse.json({ booking, pricing });
}
