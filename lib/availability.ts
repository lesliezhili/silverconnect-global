// filepath: lib/availability.ts
import { supabase, supabaseAdmin } from './supabase';
import { getPublicHolidayName } from './pricing';

// =====================================================
// AVAILABILITY TYPES
// =====================================================

export interface AvailabilityWindow {
  id?: string;
  provider_id: string;
  day: number; // 0-6 (Sunday-Saturday)
  start: string; // HH:MM format
  end: string; // HH:MM format
  is_available: boolean;
  is_recurring?: boolean;
  specific_date?: string; // For one-time availability
}

export interface BlockedTimeSlot {
  id?: string;
  provider_id: string;
  blocked_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM format, null means entire day
  end_time?: string; // HH:MM format
  reason: string;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'availability' | 'booking' | 'blocked';
    description: string;
    start: string;
    end: string;
  }>;
}

export interface DayAvailability {
  day: number;
  dayName: string;
  windows: Array<{
    start: string;
    end: string;
    isAvailable: boolean;
  }>;
  isHoliday: boolean;
  holidayName?: string;
}

// =====================================================
// DAY MAPPING
// =====================================================

export const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// =====================================================
// AVAILABILITY WINDOWS MANAGEMENT
// =====================================================

/**
 * Get provider's availability windows
 */
export async function getProviderAvailability(
  providerId: string,
  startDate?: string,
  endDate?: string
): Promise<AvailabilityWindow[]> {
  let query = supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .order('day_of_week');

  if (startDate && endDate) {
    // Get both recurring and one-time availability
    query = query.or(`is_recurring.eq.true,specific_date.gte.${startDate},specific_date.lte.${endDate}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching availability:', error);
    return [];
  }

  return data || [];
}

/**
 * Add availability window(s) for a provider
 */
export async function addAvailability(
  providerId: string,
  windows: Array<{
    day?: number;
    start: string;
    end: string;
    isAvailable?: boolean;
    specificDate?: string;
  }>
): Promise<{ success: boolean; error?: string; windows?: AvailabilityWindow[] }> {
  try {
    const records = windows.map(w => ({
      provider_id: providerId,
      day_of_week: w.day ?? null,
      start_time: w.start,
      end_time: w.end,
      is_available: w.isAvailable ?? true,
      is_recurring: !w.specificDate,
      specific_date: w.specificDate || null,
    }));

    const { data, error } = await supabaseAdmin
      .from('provider_availability')
      .insert(records)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, windows: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update an availability window
 */
export async function updateAvailability(
  windowId: string,
  updates: {
    start?: string;
    end?: string;
    isAvailable?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('provider_availability')
      .update({
        start_time: updates.start,
        end_time: updates.end,
        is_available: updates.isAvailable,
      })
      .eq('id', windowId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove an availability window
 */
export async function removeAvailability(windowId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('provider_availability')
      .delete()
      .eq('id', windowId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Set provider's full availability schedule (replace all)
 */
export async function setProviderAvailability(
  providerId: string,
  windows: Array<{
    day: number;
    start: string;
    end: string;
    isAvailable: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing recurring availability
    await supabaseAdmin
      .from('provider_availability')
      .delete()
      .eq('provider_id', providerId)
      .eq('is_recurring', true);

    // Insert new availability
    if (windows.length > 0) {
      const records = windows.map(w => ({
        provider_id: providerId,
        day_of_week: w.day,
        start_time: w.start,
        end_time: w.end,
        is_available: w.isAvailable,
        is_recurring: true,
      }));

      const { error } = await supabaseAdmin
        .from('provider_availability')
        .insert(records);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// BLOCKED TIMES MANAGEMENT
// =====================================================

/**
 * Get provider's blocked times
 */
export async function getProviderBlockedTimes(
  providerId: string,
  startDate?: string,
  endDate?: string
): Promise<BlockedTimeSlot[]> {
  let query = supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', providerId)
    .order('blocked_date');

  if (startDate && endDate) {
    query = query.gte('blocked_date', startDate).lte('blocked_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching blocked times:', error);
    return [];
  }

  return data || [];
}

/**
 * Add blocked time(s) for a provider
 */
export async function addBlockedTime(
  providerId: string,
  blockedTimes: Array<{
    blockedDate: string;
    startTime?: string;
    endTime?: string;
    reason: string;
  }>
): Promise<{ success: boolean; error?: string; blocked?: BlockedTimeSlot[] }> {
  try {
    const records = blockedTimes.map(bt => ({
      provider_id: providerId,
      blocked_date: bt.blockedDate,
      start_time: bt.startTime || null,
      end_time: bt.endTime || null,
      reason: bt.reason,
    }));

    const { data, error } = await supabaseAdmin
      .from('provider_blocked_times')
      .insert(records)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, blocked: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove a blocked time
 */
export async function removeBlockedTime(blockedTimeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('provider_blocked_times')
      .delete()
      .eq('id', blockedTimeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// CONFLICT DETECTION
// =====================================================

/**
 * Check for overlapping availability windows
 */
export function detectOverlappingWindows(
  windows: Array<{ start: string; end: string }>
): Array<{ window1: number; window2: number }> {
  const overlaps: Array<{ window1: number; window2: number }> = [];

  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      const w1 = windows[i];
      const w2 = windows[j];

      // Check if windows overlap
      if (w1.start < w2.end && w1.end > w2.start) {
        overlaps.push({ window1: i, window2: j });
      }
    }
  }

  return overlaps;
}

/**
 * Check for conflicts between availability and bookings
 */
export async function checkAvailabilityConflicts(
  providerId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<ConflictCheck> {
  const conflicts: ConflictCheck['conflicts'] = [];
  const dateStr = date.split('T')[0];

  // Check blocked times
  const { data: blockedTimes } = await supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', providerId)
    .eq('blocked_date', dateStr);

  if (blockedTimes && blockedTimes.length > 0) {
    for (const block of blockedTimes) {
      const blockStart = block.start_time || '00:00';
      const blockEnd = block.end_time || '23:59';

      if (startTime < blockEnd && endTime > blockStart) {
        conflicts.push({
          type: 'blocked',
          description: block.reason || 'Time is blocked',
          start: blockStart,
          end: blockEnd,
        });
      }
    }
  }

  // Check existing bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .eq('booking_date', dateStr)
    .in('status', ['pending', 'confirmed']);

  if (bookings && bookings.length > 0) {
    for (const booking of bookings) {
      const bookingStart = booking.start_time;
      const bookingEnd = calculateEndTime(booking.start_time, booking.duration_hours);

      if (startTime < bookingEnd && endTime > bookingStart) {
        conflicts.push({
          type: 'booking',
          description: `Existing booking (${booking.service_type || 'service'})`,
          start: bookingStart,
          end: bookingEnd,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Check for overlapping availability windows in the database
 */
export async function checkDatabaseOverlaps(
  providerId: string,
  dayOfWeek: number,
  newStart: string,
  newEnd: string,
  excludeWindowId?: string
): Promise<boolean> {
  const { data: existingWindows } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .neq('id', excludeWindowId || '');

  if (existingWindows && existingWindows.length > 0) {
    for (const window of existingWindows) {
      if (newStart < window.end_time && newEnd > window.start_time) {
        return true; // Overlap detected
      }
    }
  }

  return false;
}

// =====================================================
// PUBLIC HOLIDAY DETECTION
// =====================================================

/**
 * Check if a date is a public holiday and get details
 */
export function checkPublicHoliday(date: Date | string, countryCode: string = 'AU'): {
  isHoliday: boolean;
  holidayName?: string;
  loading?: number;
} {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = d.toISOString().split('T')[0];

  const holidayName = getPublicHolidayName(date, countryCode);

  if (holidayName) {
    const loading = countryCode === 'AU' ? 1.50 : 2.00;
    return { isHoliday: true, holidayName, loading };
  }

  return { isHoliday: false };
}

/**
 * Get availability for a specific date including holiday info
 */
export async function getDateAvailability(
  providerId: string,
  date: string,
  countryCode: string = 'AU'
): Promise<DayAvailability> {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const holidayInfo = checkPublicHoliday(date, countryCode);

  // Get recurring availability for this day
  const { data: recurringAvailability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_recurring', true)
    .eq('is_available', true);

  // Get one-time availability for this specific date
  const { data: oneTimeAvailability } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('specific_date', date.split('T')[0])
    .eq('is_available', true);

  const windows: DayAvailability['windows'] = [];

  // Add recurring windows
  if (recurringAvailability) {
    for (const w of recurringAvailability) {
      windows.push({
        start: w.start_time,
        end: w.end_time,
        isAvailable: w.is_available,
      });
    }
  }

  // Add one-time windows
  if (oneTimeAvailability) {
    for (const w of oneTimeAvailability) {
      windows.push({
        start: w.start_time,
        end: w.end_time,
        isAvailable: w.is_available,
      });
    }
  }

  return {
    day: dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    windows,
    isHoliday: holidayInfo.isHoliday,
    holidayName: holidayInfo.holidayName,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate end time from start time and duration
 */
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Validate time range (start < end)
 */
export function isValidTimeRange(start: string, end: string): boolean {
  return start < end;
}

/**
 * Generate default 24-hour availability for a day
 */
export function generateFullDayAvailability(day: number): AvailabilityWindow {
  return {
    provider_id: '',
    day,
    start: '00:00',
    end: '24:00',
    is_available: true,
    is_recurring: true,
  };
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableTimeSlots(
  providerId: string,
  date: string,
  countryCode: string = 'AU',
  slotDuration: number = 2 // hours
): Promise<string[]> {
  const dayAvailability = await getDateAvailability(providerId, date, countryCode);
  const availableSlots: string[] = [];

  // Get blocked times for this date
  const { data: blockedTimes } = await supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', providerId)
    .eq('blocked_date', date.split('T')[0]);

  // Get existing bookings for this date
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .eq('booking_date', date.split('T')[0])
    .in('status', ['pending', 'confirmed']);

  // Generate slots from each availability window
  for (const window of dayAvailability.windows) {
    let currentTime = window.start;
    
    while (currentTime < window.end) {
      const slotEnd = calculateEndTime(currentTime, slotDuration);
      
      if (slotEnd > window.end) break;

      // Check if slot conflicts with blocked times
      let isBlocked = false;
      if (blockedTimes) {
        for (const block of blockedTimes) {
          const blockStart = block.start_time || '00:00';
          const blockEnd = block.end_time || '23:59';
          
          if (currentTime < blockEnd && slotEnd > blockStart) {
            isBlocked = true;
            break;
          }
        }
      }

      // Check if slot conflicts with existing bookings
      if (!isBlocked && bookings) {
        for (const booking of bookings) {
          const bookingStart = booking.start_time;
          const bookingEnd = calculateEndTime(booking.start_time, booking.duration_hours);
          
          if (currentTime < bookingEnd && slotEnd > bookingStart) {
            isBlocked = true;
            break;
          }
        }
      }

      if (!isBlocked) {
        availableSlots.push(currentTime);
      }

      // Move to next slot (30-minute increments)
      const [h, m] = currentTime.split(':').map(Number);
      const nextMinutes = h * 60 + m + 30;
      currentTime = `${Math.floor(nextMinutes / 60).toString().padStart(2, '0')}:${(nextMinutes % 60).toString().padStart(2, '0')}`;
    }
  }

  return availableSlots;
}