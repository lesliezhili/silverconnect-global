// filepath: api/routes/providers.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProviderService, ProviderAvailability } from '../services/provider.service';

/**
 * GET /api/providers
 * Get all providers with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country_code = searchParams.get('country_code');
    const city = searchParams.get('city');
    const specialties = searchParams.get('specialties')?.split(',');
    const is_verified = searchParams.get('is_verified') === 'true';

    const providers = await ProviderService.getProviders({
      country_code: country_code || undefined,
      city: city || undefined,
      specialties: specialties,
      is_verified,
    });

    return NextResponse.json(providers);
  } catch (error: any) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers
 * Create a new provider profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      email,
      fullName,
      phone,
      countryCode,
      city,
      address,
      latitude,
      longitude,
      specialties,
      bio,
      yearsExperience,
      certifications,
    } = body;

    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const provider = await ProviderService.createProvider({
      user_id: userId,
      email,
      full_name: fullName,
      phone,
      country_code: countryCode,
      city,
      address,
      latitude,
      longitude,
      specialties,
      bio,
      years_experience: yearsExperience,
      certifications,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create provider' },
      { status: 500 }
    );
  }
}