import { supabase } from './supabase'

export interface ProviderProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  country_code: string
  city: string
  rating: number
  total_ratings: number
  specialties: string[]
  bio: string
  years_experience: number
  certifications: string[]
  profile_image: string
  is_verified: boolean
  is_christian: boolean
}

export async function getProviderById(providerId: string): Promise<ProviderProfile | null> {
  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('id', providerId)
    .single()

  if (error) return null
  return data
}

export async function getProviderByUserId(userId: string): Promise<ProviderProfile | null> {
  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

export async function getProvidersByService(serviceId: string, countryCode: string): Promise<ProviderProfile[]> {
  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('country_code', countryCode)
    .contains('specialties', [serviceId])
    .eq('is_verified', true)
    .order('rating', { ascending: false })

  if (error) return []
  return data || []
}

export async function updateProviderRating(providerId: string): Promise<void> {
  const { data: feedback } = await supabase
    .from('customer_feedback')
    .select('rating')
    .eq('provider_id', providerId)

  if (feedback && feedback.length > 0) {
    const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
    
    await supabase
      .from('service_providers')
      .update({ 
        rating: Math.round(avgRating * 10) / 10, 
        total_ratings: feedback.length 
      })
      .eq('id', providerId)
  }
}

export async function verifyProvider(providerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_providers')
    .update({ 
      is_verified: true, 
      verification_date: new Date().toISOString() 
    })
    .eq('id', providerId)

  return !error
}