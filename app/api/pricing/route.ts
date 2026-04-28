// filepath: app/api/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, calculatePriceSync, isProviderAvailable, getPricingExplanation, PricingInput } from '@/lib/pricing';
import { checkAvailabilityConflicts } from '@/lib/availability';

// GET /api/pricing - Calculate booking price using new pricing engine
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const providerId = searchParams.get('provider_id');
    const countryCode = (searchParams.get('country_code') || 'AU') as 'AU' | 'CA';
    const bookingDate = searchParams.get('booking_date');
    const bookingTime = searchParams.get('booking_time');
    const duration = Number.parseFloat(searchParams.get('duration') || '2');

    if (!serviceId || !providerId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'service_id, provider_id, booking_date, and booking_time are required' },
        { status: 400 }
      );
    }

    // Use the new pricing engine
    const pricingInput: PricingInput = {
      serviceId,
      providerId,
      countryCode,
      bookingDate,
      bookingTime,
      duration,
    };

    // Try async version first, fall back to sync
    let priceResult;
    try {
      priceResult = await calculatePrice(pricingInput);
    } catch (dbError) {
      console.warn('DB pricing failed, using sync version:', dbError);
      priceResult = calculatePriceSync(pricingInput);
    }

    // Check availability
    const isAvailable = await isProviderAvailable(providerId, bookingDate, bookingTime);

    // Get pricing explanation for AI/frontend
    const explanation = getPricingExplanation(countryCode, serviceId, bookingDate, bookingTime, duration);

    return NextResponse.json({
      ...priceResult,
      available: isAvailable,
      explanation: {
        summary: explanation.summary,
        breakdown: explanation.breakdown,
      },
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pricing - Check availability and get price using new engines
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, providerId, countryCode, bookingDate, bookingTime, duration } = body;

    if (!serviceId || !providerId || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: 'serviceId, providerId, bookingDate, and bookingTime are required' },
        { status: 400 }
      );
    }

    const country = (countryCode || 'AU') as 'AU' | 'CA';
    const durationHours = duration || 2;

    // Use the new pricing engine
    const pricingInput: PricingInput = {
      serviceId,
      providerId,
      countryCode: country,
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

    // Check availability using new availability engine
    const isAvailable = await isProviderAvailable(providerId, bookingDate, bookingTime);

    // Check for conflicts
    const conflictCheck = await checkAvailabilityConflicts(providerId, bookingDate, bookingTime, bookingTime);

    // Get pricing explanation
    const explanation = getPricingExplanation(country, serviceId, bookingDate, bookingTime, durationHours);

    return NextResponse.json({
      available: isAvailable && !conflictCheck.hasConflict,
      conflicts: conflictCheck.conflicts,
      ...priceResult,
      explanation: {
        summary: explanation.summary,
        breakdown: explanation.breakdown,
        recommendations: explanation.recommendations,
      },
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}