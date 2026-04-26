// filepath: api/services/provider.service.ts
import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface ProviderProfile {
  id?: string;
  user_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  country_code?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  specialties?: string[];
  bio?: string;
  years_experience?: number;
  certifications?: string[];
  profile_image?: string;
  rating?: number;
  total_ratings?: number;
  is_verified?: boolean;
  verification_date?: string;
  available_hours?: Record<string, string>;
  stripe_connect_id?: string;
  created_at?: string;
}

export interface ProviderAvailability {
  id?: string;
  provider_id: string;
  day_of_week: number;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
}

export class ProviderService {
  
  /**
   * Create a new provider profile
   */
  static async createProvider(data: ProviderProfile): Promise<ProviderProfile> {
    const { data: provider, error } = await supabase
      .from('service_providers')
      .insert({
        user_id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        country_code: data.country_code,
        city: data.city,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        specialties: data.specialties || [],
        bio: data.bio,
        years_experience: data.years_experience,
        certifications: data.certifications || [],
        profile_image: data.profile_image,
        rating: 5.0,
        total_ratings: 0,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating provider:', error);
      throw new Error(error.message);
    }

    return provider;
  }

  /**
   * Get provider by user ID
   */
  static async getProviderByUserId(userId: string): Promise<ProviderProfile | null> {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No provider found
      }
      console.error('Error fetching provider:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get provider by ID
   */
  static async getProviderById(providerId: string): Promise<ProviderProfile | null> {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching provider:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update provider profile
   */
  static async updateProvider(providerId: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    const { data: provider, error } = await supabase
      .from('service_providers')
      .update(data)
      .eq('id', providerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider:', error);
      throw new Error(error.message);
    }

    return provider;
  }

  /**
   * Get all providers (with optional filters)
   */
  static async getProviders(filters?: {
    country_code?: string;
    city?: string;
    specialties?: string[];
    is_verified?: boolean;
  }): Promise<ProviderProfile[]> {
    let query = supabase
      .from('service_providers')
      .select('*')
      .eq('is_verified', filters?.is_verified ?? true);

    if (filters?.country_code) {
      query = query.eq('country_code', filters.country_code);
    }

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters?.specialties && filters.specialties.length > 0) {
      query = query.contains('specialties', filters.specialties);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching providers:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Set provider availability
   */
  static async setAvailability(providerId: string, availability: ProviderAvailability[]): Promise<void> {
    // First delete existing availability
    const { error: deleteError } = await supabase
      .from('provider_availability')
      .delete()
      .eq('provider_id', providerId);

    if (deleteError) {
      console.error('Error deleting availability:', deleteError);
      throw new Error(deleteError.message);
    }

    // Then insert new availability
    if (availability.length > 0) {
      const { error: insertError } = await supabase
        .from('provider_availability')
        .insert(availability.map(a => ({
          provider_id: providerId,
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          is_available: a.is_available,
        })));

      if (insertError) {
        console.error('Error inserting availability:', insertError);
        throw new Error(insertError.message);
      }
    }
  }

  /**
   * Get provider availability
   */
  static async getAvailability(providerId: string): Promise<ProviderAvailability[]> {
    const { data, error } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', providerId)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching availability:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Search providers by location and services
   */
  static async searchProviders(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    services?: string[];
    country_code?: string;
  }): Promise<ProviderProfile[]> {
    // For now, return all verified providers
    // In production, you'd use PostGIS for geospatial queries
    const { data, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('is_verified', true)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error searching providers:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Link Stripe Connect account to provider
   */
  static async linkStripeAccount(providerId: string, stripeConnectId: string): Promise<void> {
    const { error } = await supabase
      .from('service_providers')
      .update({ stripe_connect_id: stripeConnectId })
      .eq('id', providerId);

    if (error) {
      console.error('Error linking Stripe account:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Get provider's bookings
   */
  static async getProviderBookings(providerId: string, status?: string): Promise<any[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        user:users(*)
      `)
      .eq('provider_id', providerId)
      .order('booking_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching provider bookings:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Accept a booking
   */
  static async acceptBooking(bookingId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'CONFIRMED' })
      .eq('id', bookingId)
      .eq('provider_id', providerId);

    if (error) {
      console.error('Error accepting booking:', error);
      throw new Error(error.message);
    }

    // Add status history
    await supabase.from('booking_status_history').insert({
      booking_id: bookingId,
      old_status: 'PENDING',
      new_status: 'CONFIRMED',
      changed_by: providerId,
      reason: 'Provider accepted the booking',
    });
  }

  /**
   * Decline a booking
   */
  static async declineBooking(bookingId: string, providerId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'DECLINED' })
      .eq('id', bookingId)
      .eq('provider_id', providerId);

    if (error) {
      console.error('Error declining booking:', error);
      throw new Error(error.message);
    }

    // Add status history
    await supabase.from('booking_status_history').insert({
      booking_id: bookingId,
      old_status: 'PENDING',
      new_status: 'DECLINED',
      changed_by: providerId,
      reason,
    });
  }

  /**
   * Complete a booking
   */
  static async completeBooking(bookingId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('provider_id', providerId);

    if (error) {
      console.error('Error completing booking:', error);
      throw new Error(error.message);
    }

    // Add status history
    await supabase.from('booking_status_history').insert({
      booking_id: bookingId,
      old_status: 'CONFIRMED',
      new_status: 'COMPLETED',
      changed_by: providerId,
      reason: 'Service completed',
    });
  }
}