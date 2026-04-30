import { NextRequest, NextResponse } from 'next/server';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { 
  getProviderAvailability, 
  getAvailableTimeSlots, 
  saveProviderAvailability,
  checkAvailability 
} from '@/lib/availability';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('providerId');
  const date = searchParams.get('date');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const duration = parseInt(searchParams.get('duration') || '60');

  // Get provider
  let targetProviderId = providerId;
  if (!targetProviderId) {
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    targetProviderId = provider?.id;
  }

  if (!targetProviderId) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  // If specific date, return available time slots with start/end times
  if (date) {
    const { slots, grouped_slots } = await getAvailableTimeSlots(
      targetProviderId, 
      date, 
      duration
    );
    
    return NextResponse.json({ 
      date,
      provider_id: targetProviderId,
      slots: slots, // Each slot has start_time and end_time
      grouped_slots: grouped_slots,
      total_available: slots.length
    });
  }

  // Get availability windows for admin
  const availability = await getProviderAvailability(targetProviderId, startDate || undefined);
  
  // Format availability for frontend
  const formattedAvailability = availability.map(slot => ({
    id: slot.id,
    day_of_week: slot.day_of_week,
    dayName: DAY_NAMES[slot.day_of_week],
    slot_name: slot.slot_name,
    start_time: slot.start_time,
    end_time: slot.end_time,
    break_duration_minutes: slot.break_duration_minutes,
    is_available: slot.is_available,
  }));

  return NextResponse.json({ 
    availability: formattedAvailability,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { availability, mode = 'replace' } = body;

  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  try {
    const success = await saveProviderAvailability(provider.id, availability);
    if (!success) {
      return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slotId = searchParams.get('id');

  const { error } = await supabase
    .from('provider_availability')
    .delete()
    .eq('id', slotId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}