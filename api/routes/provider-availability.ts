// filepath: api/routes/provider-availability.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProviderService } from '../services/provider.service';

/**
 * GET /api/provider-availability?providerId=xxx
 * Get provider's availability
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const availability = await ProviderService.getAvailability(providerId);
    return NextResponse.json(availability);
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider-availability
 * Set provider's availability
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, availability } = body;

    if (!providerId || !availability) {
      return NextResponse.json(
        { error: 'Provider ID and availability are required' },
        { status: 400 }
      );
    }

    await ProviderService.setAvailability(providerId, availability);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set availability' },
      { status: 500 }
    );
  }
}