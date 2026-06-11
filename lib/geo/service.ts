"use server";

/**
 * FREE Geocoding: OpenStreetMap Nominatim
 * - No API key required
 * - Rate limit: 1 request/second (respect via delay)
 * - Must include User-Agent header per Nominatim usage policy
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "SilverConnect-Global/1.0 (non-profit elder care platform)";

export async function geocodeAddress(address: string): Promise<{
  success: boolean;
  lat?: number;
  lng?: number;
  displayName?: string;
  error?: string;
}> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) return { success: false, error: "Geocoding service unavailable" };

    const results = await res.json();
    if (!results.length) return { success: false, error: "Address not found" };

    const { lat, lon, display_name } = results[0];
    return { success: true, lat: parseFloat(lat), lng: parseFloat(lon), displayName: display_name };
  } catch (e) {
    return { success: false, error: "Geocoding failed" };
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<{
  success: boolean;
  address?: string;
  postcode?: string;
}> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: "json",
    });

    const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) return { success: false };

    const data = await res.json();
    return {
      success: true,
      address: data.display_name,
      postcode: data.address?.postcode,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * (zero cost, no API needed)
 */
export async function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): Promise<number> {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
