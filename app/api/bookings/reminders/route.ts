// filepath: app/api/bookings/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/bookings/reminders - Get reminders for user's bookings
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's bookings and their reminders
  const { data: reminders, error } = await (await import('@/lib/supabase')).supabase
    .from('booking_reminders')
    .select(`
      *,
      bookings (
        id,
        booking_date,
        booking_time,
        address,
        services (name),
        service_providers (full_name)
      )
    `)
    .eq('bookings.user_id', user.id)
    .eq('sent', false)
    .gte('reminder_datetime', new Date().toISOString())
    .order('reminder_datetime', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reminders: reminders || [] });
}

// POST /api/bookings/reminders - Create reminder
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bookingId, reminderType, reminderDatetime } = body;

    if (!bookingId || !reminderType || !reminderDatetime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership
    const { data: booking } = await (await import('@/lib/supabase')).supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.user_id !== user.id) {
      return NextResponse.json({ error: "Booking not found or forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('booking_reminders')
      .insert({
        booking_id: bookingId,
        reminder_type: reminderType,
        reminder_datetime: reminderDatetime,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, reminder: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/bookings/reminders - Mark reminder as sent (called by background job)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('booking_reminders')
      .update({ sent: true, sent_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, reminder: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/reminders - Delete reminder
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('booking_reminders')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}