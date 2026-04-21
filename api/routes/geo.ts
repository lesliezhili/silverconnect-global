import { NextRequest, NextResponse } from 'next/server';
import { GeoService } from '../services/geo.service';

/**
 * GET /api/geo/countries
 * Get list of supported countries
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get('country');

    if (countryCode) {
      const data = GeoService.getCountryData(countryCode);
      return NextResponse.json(data);
    }

    const countries = GeoService.getSupportedCountries();
    return NextResponse.json(countries);
  } catch (error: any) {
    console.error('Geo data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve geo data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo/calculate-price
 * Calculate price with tax
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { basePrice, countryCode } = body;

    if (basePrice === undefined || !countryCode) {
      return NextResponse.json(
        { error: 'Missing basePrice or countryCode' },
        { status: 400 }
      );
    }

    const pricing = GeoService.calculatePriceWithTax(basePrice, countryCode);
    return NextResponse.json(pricing);
  } catch (error: any) {
    console.error('Price calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate price' },
      { status: 500 }
    );
  }
}
