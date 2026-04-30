import { supabase } from './supabase'
import { calculateDistance, Coordinates } from './locationUtils'

export interface MatchingCriteria {
  serviceId: string
  countryCode: string
  suburb?: string
  postcode?: string
  latitude?: number
  longitude?: number
  preferredDate?: string
  preferredTime?: string
  requiresChristianProvider?: boolean
  maxDistanceKm?: number
  minRating?: number
}

export interface MatchedProvider {
  id: string
  full_name: string
  email: string
  phone: string
  rating: number
  total_ratings: number
  profile_image: string
  distance_km?: number
  specialties: string[]
  years_experience: number
  price_estimate: number
}

export async function findMatchingProviders(criteria: MatchingCriteria): Promise<MatchedProvider[]> {
  let query = supabase
    .from('service_providers')
    .select(`
      id,
      full_name,
      email,
      phone,
      rating,
      total_ratings,
      profile_image,
      specialties,
      latitude,
      longitude,
      city,
      address,
      years_experience
    `)
    .eq('is_verified', true)
    .gte('rating', criteria.minRating || 3)

  if (criteria.countryCode) {
    query = query.eq('country_code', criteria.countryCode)
  }

  if (criteria.suburb) {
    query = query.ilike('city', `%${criteria.suburb}%`)
  }

  if (criteria.postcode) {
    query = query.eq('postal_code', criteria.postcode)
  }

  const { data: providers, error } = await query

  if (error || !providers) {
    console.error('Error finding providers:', error)
    return []
  }

  const matchedProviders: MatchedProvider[] = []

  for (const provider of providers) {
    let distanceKm: number | undefined
    
    if (criteria.latitude && criteria.longitude && provider.latitude && provider.longitude) {
      distanceKm = calculateDistance(
        { lat: criteria.latitude, lng: criteria.longitude },
        { lat: provider.latitude, lng: provider.longitude }
      )

      if (criteria.maxDistanceKm && distanceKm > criteria.maxDistanceKm) {
        continue
      }
    }

    matchedProviders.push({
      id: provider.id,
      full_name: provider.full_name,
      email: provider.email,
      phone: provider.phone,
      rating: provider.rating || 5.0,
      total_ratings: provider.total_ratings || 0,
      profile_image: provider.profile_image || '',
      distance_km: distanceKm,
      specialties: provider.specialties || [],
      years_experience: provider.years_experience || 0,
      price_estimate: 50
    })
  }

  return matchedProviders.sort((a, b) => {
    if (a.rating !== b.rating) return b.rating - a.rating
    if (a.distance_km !== undefined && b.distance_km !== undefined) {
      return a.distance_km - b.distance_km
    }
    return 0
  })
}

export async function findBestMatch(criteria: MatchingCriteria): Promise<MatchedProvider | null> {
  const matches = await findMatchingProviders(criteria)
  return matches[0] || null
}

// Find providers near a postcode
export async function providersNearPostcode(
  postcode: string,
  serviceId?: string,
  limit: number = 10
): Promise<MatchedProvider[]> {
  try {
    // Query only columns that exist in your schema
    let query = supabase
      .from('service_providers')
      .select(`
        id,
        full_name,
        email,
        phone,
        rating,
        total_ratings,
        profile_image,
        specialties,
        city,
        years_experience
      `)
      .eq('is_verified', true)
      .eq('postal_code', postcode)

    if (serviceId) {
      query = query.contains('specialties', [serviceId])
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      console.error('Error finding providers near postcode:', error.message)
      return getMockProviders()
    }

    if (data && data.length > 0) {
      return data.map(provider => ({
        id: provider.id,
        full_name: provider.full_name,
        email: provider.email,
        phone: provider.phone,
        rating: provider.rating || 5.0,
        total_ratings: provider.total_ratings || 0,
        profile_image: provider.profile_image || '',
        specialties: provider.specialties || [],
        years_experience: provider.years_experience || 0,
        price_estimate: 50
      }))
    }

    return getMockProviders()
  } catch (err) {
    console.error('Error in providersNearPostcode:', err)
    return getMockProviders()
  }
}

// Mock providers for demo when database is empty
function getMockProviders(): MatchedProvider[] {
  return [
    {
      id: '1',
      full_name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '0400 000 001',
      rating: 4.9,
      total_ratings: 128,
      profile_image: '',
      specialties: ['cleaning', 'cooking'],
      years_experience: 5,
      price_estimate: 55
    },
    {
      id: '2',
      full_name: 'Michael Chen',
      email: 'michael@example.com',
      phone: '0400 000 002',
      rating: 4.8,
      total_ratings: 95,
      profile_image: '',
      specialties: ['gardening', 'maintenance'],
      years_experience: 3,
      price_estimate: 50
    },
    {
      id: '3',
      full_name: 'Emma Williams',
      email: 'emma@example.com',
      phone: '0400 000 003',
      rating: 5.0,
      total_ratings: 67,
      profile_image: '',
      specialties: ['personal', 'cleaning'],
      years_experience: 7,
      price_estimate: 60
    },
    {
      id: '4',
      full_name: 'David Lee',
      email: 'david@example.com',
      phone: '0400 000 004',
      rating: 4.7,
      total_ratings: 42,
      profile_image: '',
      specialties: ['cooking', 'personal'],
      years_experience: 4,
      price_estimate: 45
    },
    {
      id: '5',
      full_name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '0400 000 005',
      rating: 4.9,
      total_ratings: 89,
      profile_image: '',
      specialties: ['cleaning', 'gardening'],
      years_experience: 6,
      price_estimate: 58
    }
  ]
}

// Find providers near a location (latitude/longitude)
export async function providersNearLocation(
  latitude: number,
  longitude: number,
  serviceId?: string,
  maxDistanceKm: number = 20,
  limit: number = 10
): Promise<MatchedProvider[]> {
  try {
    let query = supabase
      .from('service_providers')
      .select(`
        id,
        full_name,
        email,
        phone,
        rating,
        total_ratings,
        profile_image,
        specialties,
        latitude,
        longitude,
        city,
        years_experience
      `)
      .eq('is_verified', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (serviceId) {
      query = query.contains('specialties', [serviceId])
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('Error finding providers near location:', error)
      return getMockProviders().slice(0, limit)
    }

    const providersWithDistance: (MatchedProvider & { distance: number })[] = []

    for (const provider of data) {
      if (provider.latitude && provider.longitude) {
        const distance = calculateDistance(
          { lat: latitude, lng: longitude },
          { lat: provider.latitude, lng: provider.longitude }
        )

        if (distance <= maxDistanceKm) {
          providersWithDistance.push({
            id: provider.id,
            full_name: provider.full_name,
            email: provider.email,
            phone: provider.phone,
            rating: provider.rating || 5.0,
            total_ratings: provider.total_ratings || 0,
            profile_image: provider.profile_image || '',
            distance_km: distance,
            specialties: provider.specialties || [],
            years_experience: provider.years_experience || 0,
            price_estimate: 50,
            distance
          })
        }
      }
    }

    if (providersWithDistance.length === 0) {
      return getMockProviders().slice(0, limit)
    }

    return providersWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(({ distance, ...provider }) => provider)
  } catch (err) {
    console.error('Error in providersNearLocation:', err)
    return getMockProviders().slice(0, limit)
  }
}

// Get featured providers for homepage
export async function getFeaturedProviders(limit: number = 6): Promise<MatchedProvider[]> {
  try {
    const { data, error } = await supabase
      .from('service_providers')
      .select(`
        id,
        full_name,
        email,
        phone,
        rating,
        total_ratings,
        profile_image,
        specialties,
        city,
        years_experience
      `)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured providers:', error)
      return getMockProviders().slice(0, limit)
    }

    if (!data || data.length === 0) {
      return getMockProviders().slice(0, limit)
    }

    return data.map(provider => ({
      id: provider.id,
      full_name: provider.full_name,
      email: provider.email,
      phone: provider.phone,
      rating: provider.rating || 5.0,
      total_ratings: provider.total_ratings || 0,
      profile_image: provider.profile_image || '',
      specialties: provider.specialties || [],
      years_experience: provider.years_experience || 0,
      price_estimate: 50
    }))
  } catch (err) {
    console.error('Error in getFeaturedProviders:', err)
    return getMockProviders().slice(0, limit)
  }
}

// Search providers by name or specialty
export async function searchProviders(
  query: string,
  countryCode: string,
  limit: number = 20
): Promise<MatchedProvider[]> {
  try {
    const searchQuery = supabase
      .from('service_providers')
      .select(`
        id,
        full_name,
        email,
        phone,
        rating,
        total_ratings,
        profile_image,
        specialties,
        city,
        years_experience
      `)
      .eq('is_verified', true)
      .eq('country_code', countryCode)
      .limit(limit)

    if (query) {
      searchQuery.or(`full_name.ilike.%${query}%,specialties.cs.{${query}}`)
    }

    const { data, error } = await searchQuery

    if (error || !data) {
      console.error('Error searching providers:', error)
      return getMockProviders().slice(0, limit)
    }

    if (data.length === 0) {
      return getMockProviders().slice(0, limit)
    }

    return data.map(provider => ({
      id: provider.id,
      full_name: provider.full_name,
      email: provider.email,
      phone: provider.phone,
      rating: provider.rating || 5.0,
      total_ratings: provider.total_ratings || 0,
      profile_image: provider.profile_image || '',
      specialties: provider.specialties || [],
      years_experience: provider.years_experience || 0,
      price_estimate: 50
    }))
  } catch (err) {
    console.error('Error in searchProviders:', err)
    return getMockProviders().slice(0, limit)
  }
}