import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { matchProviders } from '@/lib/matching';
import { calculatePrice, calculatePriceSync, PricingInput } from '@/lib/pricing';
import { checkAvailabilityConflicts, isProviderAvailable } from '@/lib/availability';

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
      duration,
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

    // Find available providers near the location
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

    // Filter providers by distance and availability
    let bestProvider = null;
    let bestDistance = Infinity;
    const durationHours = duration || service.duration_minutes / 60 || 2;

    if (providers && latitude && longitude) {
      for (const provider of providers) {
        if (provider.latitude && provider.longitude) {
          const distance = Math.sqrt(
            Math.pow(provider.latitude - latitude, 2) +
            Math.pow(provider.longitude - longitude, 2)
          );

          if (distance < bestDistance) {
            // Check availability for this provider
            const isAvailable = await isProviderAvailable(provider.id, bookingDate, bookingTime);
            if (isAvailable) {
              bestDistance = distance;
              bestProvider = provider;
            }
          }
        }
      }
    } else if (providers && providers.length > 0) {
      // Fallback: pick first available provider
      for (const provider of providers) {
        const isAvailable = await isProviderAvailable(provider.id, bookingDate, bookingTime);
        if (isAvailable) {
          bestProvider = provider;
          break;
        }
      }
    }

    if (!bestProvider) {
      return NextResponse.json(
        { error: 'No available providers found for this service and location' },
        { status: 404 }
      );
    }

    // Check for conflicts
    const conflictCheck = await checkAvailabilityConflicts(bestProvider.id, bookingDate, bookingTime, bookingTime);
    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        { error: 'Time slot is not available', conflicts: conflictCheck.conflicts },
        { status: 409 }
      );
    }

    // Calculate final price using new pricing engine
    const pricingInput: PricingInput = {
      serviceId,
      providerId: bestProvider.id,
      countryCode: countryCode as 'AU' | 'CA',
      bookingDate,
      bookingTime,
      duration: durationHours,
    };

    let priceResult;
    try {
      priceResult = await calculatePrice(pricingInput);
    } catch (dbError) {
      console.warn('DB pricing failed, using sync version:', dbError);
      priceResult = calculatePriceSync(pricingInput);
    }

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
        total_price: priceResult.totalPrice,
        duration_hours: durationHours,
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
      price: priceResult,
    });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}