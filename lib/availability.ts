import { supabase } from './supabase';

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  is_holiday: boolean;
  is_weekend: boolean;
}

export async function getAvailableSlots(
  provider_id: string,
  date: string,
  duration_minutes: number,
  country_code: string
): Promise<AvailableSlot[]> {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  const is_weekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check if it's a holiday
  const { data: holiday, error: holidayError } = await supabase
    .from('public_holidays')
    .select('id')
    .eq('country_code', country_code)
    .eq('date', date)
    .maybeSingle();

  if (holidayError) {
    console.error('Holiday check failed:', holidayError);
  }
  const is_holiday = Boolean(holiday);

  // Get provider availability windows
  const { data: windows, error: windowError } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', provider_id)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true);

  if (windowError) throw windowError;
  if (!windows || windows.length === 0) return [];

  // Get existing bookings for the date
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('start_datetime, end_datetime')
    .eq('provider_id', provider_id)
    .gte('start_datetime', `${date}T00:00:00`)
    .lt('start_datetime', `${date}T23:59:59`)
    .in('status', ['pending', 'confirmed', 'in_progress']);

  if (bookingError) throw bookingError;

  // Get provider buffer
  const { data: provider, error: providerError } = await supabase
    .from('service_providers')
    .select('buffer_minutes')
    .eq('id', provider_id)
    .single();

  if (providerError) throw providerError;
  const buffer_minutes = provider?.buffer_minutes || 0;

  const bookedTimes: { start: number; end: number }[] = (bookings || []).map(booking => ({
    start: new Date(booking.start_datetime).getTime() - buffer_minutes * 60000,
    end: new Date(booking.end_datetime).getTime() + buffer_minutes * 60000,
  }));

  const availableSlots: AvailableSlot[] = [];

  for (const window of windows) {
    const windowStart = new Date(`${date}T${window.start_time}`);
    const windowEnd = new Date(`${date}T${window.end_time}`);
    const stepMs = 15 * 60000; // 15 minutes

    for (let slotStart = windowStart.getTime(); slotStart + duration_minutes * 60000 <= windowEnd.getTime(); slotStart += stepMs) {
      const slotEnd = slotStart + duration_minutes * 60000;

      // Check for conflicts with existing bookings (including buffer)
      const hasConflict = bookedTimes.some(booking =>
        slotStart < booking.end && slotEnd > booking.start
      );

      if (!hasConflict) {
        availableSlots.push({
          start_time: new Date(slotStart).toTimeString().slice(0, 5),
          end_time: new Date(slotEnd).toTimeString().slice(0, 5),
          is_holiday,
          is_weekend,
        });
      }
    }
  }

  return availableSlots;
}
