export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationSuggestion {
  suburb: string
  postcode: string
  state: string
  country: string
}

// Calculate distance between two coordinates in kilometers using Haversine formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get current user location using browser geolocation
export async function getCurrentLocation(): Promise<Coordinates | null> {
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => resolve(null)
      )
    })
  }
  return null
}

// Reverse geocode to get suburb from coordinates
export async function reverseGeocode(lat: number, lng: number): Promise<LocationSuggestion | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
    const data = await response.json()
    
    if (data.address) {
      return {
        suburb: data.address.suburb || data.address.city || '',
        postcode: data.address.postcode || '',
        state: data.address.state || '',
        country: data.address.country || ''
      }
    }
    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

// Validate Australian postcode
export function isValidAustralianPostcode(postcode: string): boolean {
  const postcodeRegex = /^[0-9]{4}$/
  if (!postcodeRegex.test(postcode)) return false
  
  const postcodeNum = parseInt(postcode, 10)
  return postcodeNum >= 200 && postcodeNum <= 9999
}

// Format address for display
export function formatAddress(address: string, suburb: string, postcode: string): string {
  return `${address}, ${suburb} ${postcode}`
}