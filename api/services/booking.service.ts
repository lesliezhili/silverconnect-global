import { supabase } from './auth.service';

interface BookingPayload {
  userId: string;
  serviceId: string;
  serviceDate: string;
  serviceTime: string;
  serviceProviders?: string[];
  notes?: string;
  country: string;
  totalAmount: number;
  currency: string;
  status?: string;
}

/**
 * Booking Service
 * Handles service bookings and scheduling
 */
export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(payload: BookingPayload) {
    const {
      userId,
      serviceId,
      serviceDate,
      serviceTime,
      country,
      totalAmount,
      currency,
      status = 'pending',
      notes = '',
      serviceProviders = [],
    } = payload;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: userId,
            service_id: serviceId,
            service_date: serviceDate,
            service_time: serviceTime,
            country,
            total_amount: totalAmount,
            currency,
            status,
            notes,
            service_providers: serviceProviders,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error: any) {
      throw new Error(`Booking creation failed: ${error.message}`);
    }
  }

  /**
   * Get booking by ID
   */
  static async getBooking(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(`Failed to retrieve booking: ${error.message}`);
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(`Failed to retrieve user bookings: ${error.message}`);
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(bookingId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error: any) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error: any) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  }

  /**
   * Get available time slots
   */
  static async getAvailableSlots(serviceId: string, date: string) {
    try {
      // Get all bookings for this service on this date
      const { data, error } = await supabase
        .from('bookings')
        .select('service_time')
        .eq('service_id', serviceId)
        .eq('service_date', date)
        .eq('status', 'confirmed');

      if (error) throw error;

      const bookedTimes = data?.map((b: any) => b.service_time) || [];
      const allSlots = generateTimeSlots(); // 08:00 to 18:00
      const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

      return availableSlots;
    } catch (error: any) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }
}

/**
 * Generate available time slots (every 1 hour from 08:00 to 18:00)
 */
function generateTimeSlots(): string[] {
  const slots = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
}
