// filepath: app/api/booking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { calculatePrice, isProviderAvailable, getDayType } from '@/lib/pricing';

// GET /api/booking - Get bookings (filtered by user/provider)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    const status = searchParams.get('status');
    const providerId = searchParams.get('provider_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a provider
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let query = supabase
      .from('bookings')
      .select(`
        *,
        provider:service_providers(
          id,
          business_name,
          profile_image,
          rating,
          verification_status
        ),
        service:services(
          id,
          name,
          description,
          duration_minutes
        ),
        user:users(
          id,
          full_name,
          email,
          phone
        )
      `);

    // Filter by booking ID
    if (bookingId) {
      const { data: booking, error } = await query.eq('id', bookingId).single();
      
      if (error || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Verify access
      const isOwner = booking.user_id === user.id;
      const isProvider = provider && booking.provider_id === provider.id;
      
      if (!isOwner && !isProvider) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ booking });
    }

    // Filter by user role
    if (provider) {
      // Provider viewing their bookings
      query = query.eq('provider_id', provider.id);
    } else {
      // Customer viewing their bookings
      query = query.eq('user_id', user.id);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/booking - Create a new booking with pricing
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      serviceId, 
      providerId, 
      bookingDate, 
      bookingTime, 
      duration, 
      notes,
      countryCode = 'AU'
    } = body;

    // Validate required fields
    if (!serviceId || !providerId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'serviceId, providerId, bookingDate, and bookingTime are required' },
        { status: 400 }
      );
    }

    // Check if provider exists and is verified
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id, verification_status, user_id')
      .eq('id', providerId)
      .single();

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (provider.verification_status !== 'verified') {
      return NextResponse.json({ error: 'Provider is not verified' }, { status: 400 });
    }

    // Check availability
    const available = await isProviderAvailable(providerId, bookingDate, bookingTime);
    if (!available) {
      return NextResponse.json({ error: 'Provider is not available at this time' }, { status: 400 });
    }

    // Calculate price
    const pricing = await calculatePrice(serviceId, providerId, countryCode, bookingDate, bookingTime);
    
    const dayType = getDayType(bookingDate, countryCode);

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: user.id,
        provider_id: providerId,
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        duration_minutes: duration || 60,
        status: 'pending',
        total_amount: pricing.finalPrice,
        notes,
        day_type: dayType,
        time_slot: pricing.timeSlot,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Store pricing details
    await supabaseAdmin
      .from('booking_pricing')
      .insert({
        booking_id: booking.id,
        base_price: pricing.basePrice,
        day_type_multiplier: pricing.dayTypeMultiplier,
        time_slot_multiplier: pricing.timeSlotMultiplier,
        service_override: pricing.serviceOverride,
        provider_override: pricing.providerOverride,
        final_price: pricing.finalPrice,
        currency: pricing.currency,
      });

    return NextResponse.json({ 
      success: true, 
      booking,
      pricing: {
        basePrice: pricing.basePrice,
        dayType,
        timeSlot: pricing.timeSlot,
        dayTypeMultiplier: pricing.dayTypeMultiplier,
        finalPrice: pricing.finalPrice,
        currency: pricing.currency,
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/booking - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, status, reason } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 });
    }

    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user owns the booking or is the provider
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isOwner = booking.user_id === user.id;
    const isProvider = provider && booking.provider_id === provider.id;

    if (!isOwner && !isProvider) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update booking
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Record status change in history
    await supabaseAdmin
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        old_status: booking.status,
        new_status: status,
        changed_by: user.id,
        reason,
      });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/booking - Cancel a booking
export async function DELETE(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check ownership
    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isOwner = booking.user_id === user.id;
    const isProvider = provider && booking.provider_id === provider.id;

    if (!isOwner && !isProvider) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow cancellation of pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel a completed or already cancelled booking' },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}