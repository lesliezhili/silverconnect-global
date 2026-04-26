// filepath: app/api/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/ratings - Get ratings for a provider or booking
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('provider_id');
  const bookingId = searchParams.get('booking_id');
  const userId = searchParams.get('user_id');

  try {
    let query = supabase.from('ratings').select('*');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate average rating if provider_id provided
    let averageRating = null;
    let totalRatings = 0;
    if (providerId && data && data.length > 0) {
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      averageRating = sum / data.length;
      totalRatings = data.length;
    }

    return NextResponse.json({ 
      ratings: data, 
      averageRating,
      totalRatings 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ratings - Create a new rating
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, provider_id, rating, review_text, rating_type } = body;

    if (!booking_id || !provider_id || !rating || !rating_type) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, provider_id, rating, rating_type' },
        { status: 400 }
      );
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user is authorized to rate (either customer or provider)
    const isCustomer = booking.user_id === user.id;
    const { data: providerProfile } = await supabase
      .from('service_providers')
      .select('user_id')
      .eq('id', provider_id)
      .single();
    
    const isProvider = providerProfile?.user_id === user.id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: 'Not authorized to rate this booking' },
        { status: 403 }
      );
    }

    // Check if rating already exists
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('rating_type', rating_type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Rating already submitted for this booking' },
        { status: 400 }
      );
    }

    // Create rating
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        booking_id,
        user_id: user.id,
        provider_id,
        rating,
        review_text: review_text || null,
        rating_type, // 'customer_to_provider' or 'provider_to_customer'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update provider's average rating
    if (rating_type === 'customer_to_provider') {
      const { data: allRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('provider_id', provider_id)
        .eq('rating_type', 'customer_to_provider');

      if (allRatings && allRatings.length > 0) {
        const avgRating = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;
        await supabase
          .from('service_providers')
          .update({ 
            rating: avgRating,
            total_ratings: allRatings.length 
          })
          .eq('id', provider_id);
      }
    }

    return NextResponse.json({ rating: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}