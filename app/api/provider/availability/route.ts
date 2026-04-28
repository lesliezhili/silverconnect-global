// filepath: app/api/provider/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { 
  getProviderAvailability, 
  addAvailability, 
  updateAvailability, 
  removeAvailability,
  setProviderAvailability,
  getProviderBlockedTimes,
  addBlockedTime,
  removeBlockedTime,
  checkDatabaseOverlaps,
  getAvailableTimeSlots,
  DAY_MAP,
  isValidTimeFormat,
  isValidTimeRange
} from '@/lib/availability';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/provider/availability - Get provider availability
export async function GET(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider } = await supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  // Get query params for date range
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const includeBlocked = searchParams.get('include_blocked') === 'true';

  // Get availability using new engine
  const availability = await getProviderAvailability(provider.id, startDate || undefined, endDate || undefined);
  
  // Get blocked times if requested
  let blockedTimes = [];
  if (includeBlocked) {
    blockedTimes = await getProviderBlockedTimes(provider.id, startDate || undefined, endDate || undefined);
  }

  // Format availability for frontend
  const formattedAvailability = availability.map(slot => ({
    id: slot.id,
    day: slot.day,
    dayName: DAY_NAMES[slot.day],
    start: slot.start,
    end: slot.end,
    isAvailable: slot.is_available,
    isRecurring: slot.is_recurring,
    specificDate: slot.specific_date,
  }));

  return NextResponse.json({ 
    availability: formattedAvailability,
    blockedTimes: includeBlocked ? blockedTimes : undefined,
  });
}

// POST /api/provider/availability - Set provider availability
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { availability, mode = 'replace' } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    // Validate time slots
    if (availability && availability.length > 0) {
      for (const slot of availability) {
        if (!isValidTimeFormat(slot.start) || !isValidTimeFormat(slot.end)) {
          return NextResponse.json(
            { error: `Invalid time format: ${slot.start} - ${slot.end}. Use HH:MM format.` },
            { status: 400 }
          );
        }
        if (!isValidTimeRange(slot.start, slot.end)) {
          return NextResponse.json(
            { error: `Invalid time range: ${slot.start} must be before ${slot.end}` },
            { status: 400 }
          );
        }
        
        // Check for overlapping windows on the same day
        const dayOfWeek = typeof slot.day === 'string' ? DAY_MAP[slot.day] : slot.day;
        const hasOverlap = await checkDatabaseOverlaps(
          provider.id, 
          dayOfWeek, 
          slot.start, 
          slot.end
        );
        
        if (hasOverlap) {
          return NextResponse.json(
            { error: `Overlapping availability on ${DAY_NAMES[dayOfWeek]}` },
            { status: 409 }
          );
        }
      }
    }

    let result;
    if (mode === 'add') {
      // Add to existing availability
      result = await addAvailability(provider.id, availability);
    } else {
      // Replace all availability
      result = await setProviderAvailability(
        provider.id,
        availability.map((slot: any) => ({
          day: typeof slot.day === 'string' ? DAY_MAP[slot.day] : slot.day,
          start: slot.start,
          end: slot.end,
          isAvailable: slot.available !== false,
        }))
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Get updated availability
    const updatedAvailability = await getProviderAvailability(provider.id);

    return NextResponse.json({ 
      success: true, 
      availability: updatedAvailability 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/provider/availability - Update single availability slot
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { slotId, day, start, end, available } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    // Validate time format
    if (start && !isValidTimeFormat(start)) {
      return NextResponse.json({ error: 'Invalid start time format. Use HH:MM' }, { status: 400 });
    }
    if (end && !isValidTimeFormat(end)) {
      return NextResponse.json({ error: 'Invalid end time format. Use HH:MM' }, { status: 400 });
    }
    if (start && end && !isValidTimeRange(start, end)) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

    const result = await updateAvailability(slotId, { start, end, isAvailable: available });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/provider/availability - Delete availability slot
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get('id');

    if (!slotId) return NextResponse.json({ error: "Slot ID required" }, { status: 400 });

    const result = await removeAvailability(slotId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}