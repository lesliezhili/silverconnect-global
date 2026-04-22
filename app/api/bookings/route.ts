import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { matchProviders } from '@/lib/matching';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const {
      userId,
      serviceId,
      countryCode,
      bookingDate,
      bookingTime,
      address,
      latitude,
      longitude,
      specialInstructions,
    } = await request.json();

    if (!userId || !serviceId || !countryCode || !bookingDate || !bookingTime || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get service price for the country
    const { data: price, error: priceError } = await supabase
      .from('service_prices')
      .select('*')
      .eq('service_id', serviceId)
      .eq('country_code', countryCode)
      .single();

    if (priceError || !price) {
      return NextResponse.json(
        { error: 'Service price not found for this country' },
        { status: 404 }
      );
    }

    // Find available providers near the location
    // For now, we'll match based on service specialties and location
    // In a real implementation, we'd also check availability for the specific date/time
    const { data: providers, error: providersError } = await supabase
      .from('service_providers')
      .select(`
        *,
        provider_pricing (
          custom_price
        )
      `)
      .contains('specialties', [serviceId])
      .eq('is_verified', true);

    if (providersError) {
      console.error('Provider search error:', providersError);
    }

    // Filter providers by distance (simplified - in production use proper geocoding)
    let bestProvider = null;
    let bestDistance = Infinity;

    if (providers && latitude && longitude) {
      for (const provider of providers) {
        if (provider.latitude && provider.longitude) {
          const distance = Math.sqrt(
            Math.pow(provider.latitude - latitude, 2) +
            Math.pow(provider.longitude - longitude, 2)
          );

          if (distance < bestDistance) {
            bestDistance = distance;
            bestProvider = provider;
          }
        }
      }
    } else if (providers && providers.length > 0) {
      // Fallback: pick first available provider
      bestProvider = providers[0];
    }

    if (!bestProvider) {
      return NextResponse.json(
        { error: 'No available providers found for this service and location' },
        { status: 404 }
      );
    }

    // Calculate final price (use custom price if set, otherwise base price)
    const providerPricing = bestProvider.provider_pricing?.[0];
    const finalPrice = providerPricing?.custom_price || price.price_with_tax;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        service_id: serviceId,
        provider_id: bestProvider.id,
        country_code: countryCode,
        booking_date: bookingDate,
        booking_time: bookingTime,
        address,
        latitude,
        longitude,
        special_instructions: specialInstructions,
        total_price: finalPrice,
        status: 'PENDING',
        payment_status: 'PENDING',
      })
      .select(`
        *,
        services (
          name,
          description,
          duration_minutes
        ),
        service_providers (
          full_name,
          phone,
          rating
        )
      `)
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      booking,
      provider: bestProvider,
      price: finalPrice,
    });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}