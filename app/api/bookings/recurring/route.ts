// filepath: app/api/bookings/recurring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/bookings/recurring - Get recurring bookings
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: recurringBookings, error } = await (await import('@/lib/supabase')).supabase
    .from('recurring_bookings')
    .select(`
      *,
      services (name, description, duration_minutes),
      service_providers (id, full_name, rating)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('next_booking_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ recurringBookings: recurringBookings || [] });
}

// POST /api/bookings/recurring - Create recurring booking
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      providerId,
      serviceId,
      frequency,
      dayOfWeek,
      timeOfDay,
      address,
      specialInstructions,
      startDate,
      endDate,
      occurrences,
    } = body;

    if (!providerId || !serviceId || !frequency || !timeOfDay || !address || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('recurring_bookings')
      .insert({
        user_id: user.id,
        provider_id: providerId,
        service_id: serviceId,
        frequency,
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        address,
        special_instructions: specialInstructions,
        start_date: startDate,
        end_date: endDate,
        occurrences,
        next_booking_date: startDate,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, recurringBooking: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/bookings/recurring - Update recurring booking
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Recurring booking ID required" }, { status: 400 });

    // Verify ownership
    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('recurring_bookings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('recurring_bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, recurringBooking: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/recurring - Cancel recurring booking
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Recurring booking ID required" }, { status: 400 });

    // Verify ownership
    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('recurring_bookings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('recurring_bookings')
      .update({ is_active: false })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}