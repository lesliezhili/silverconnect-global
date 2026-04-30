import { supabase } from './supabase'

export interface AvailabilityWindow {
  id?: string
  provider_id: string
  day_of_week: number
  slot_name: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  is_available: boolean
}

export interface TimeSlot {
  start_time: string
  end_time: string
  slot_name: string
  availability_id: string
}

export async function getProviderAvailability(providerId: string, date?: string): Promise<AvailabilityWindow[]> {
  let query = supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_available', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (date) {
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()
    query = query.eq('day_of_week', dayOfWeek)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getAvailableTimeSlots(
  providerId: string,
  date: string,
  serviceDurationMinutes: number = 60
): Promise<{ slots: TimeSlot[]; grouped_slots: Record<string, TimeSlot[]> }> {
  const targetDate = new Date(date)
  const dayOfWeek = targetDate.getDay()

  const { data: windows } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .order('start_time', { ascending: true })

  if (!windows || windows.length === 0) {
    return { slots: [], grouped_slots: {} }
  }

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('provider_id', providerId)
    .eq('booking_date', date)
    .in('status', ['CONFIRMED', 'PENDING'])

  const bookedSlots = existingBookings || []
  const availableSlots: TimeSlot[] = []

  for (const window of windows) {
    const breakMinutes = window.break_duration_minutes || 15
    let currentStart = new Date(`${date}T${window.start_time}`)
    const windowEnd = new Date(`${date}T${window.end_time}`)

    while (currentStart.getTime() + (serviceDurationMinutes * 60000) <= windowEnd.getTime()) {
      const slotEnd = new Date(currentStart.getTime() + (serviceDurationMinutes * 60000))
      const startTimeStr = currentStart.toTimeString().slice(0, 5)
      const endTimeStr = slotEnd.toTimeString().slice(0, 5)

      const isAvailable = !bookedSlots.some(booking => {
        return (startTimeStr < booking.end_time && endTimeStr > booking.start_time)
      })

      if (isAvailable) {
        availableSlots.push({
          start_time: startTimeStr,
          end_time: endTimeStr,
          slot_name: window.slot_name,
          availability_id: window.id
        })
      }

      currentStart = new Date(currentStart.getTime() + (serviceDurationMinutes + breakMinutes) * 60000)
    }
  }

  const grouped_slots = availableSlots.reduce((acc, slot) => {
    const name = slot.slot_name
    if (!acc[name]) acc[name] = []
    acc[name].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  return { slots: availableSlots, grouped_slots }
}

export async function saveProviderAvailability(
  providerId: string,
  availability: Omit<AvailabilityWindow, 'id' | 'provider_id'>[]
): Promise<boolean> {
  try {
    await supabase
      .from('provider_availability')
      .delete()
      .eq('provider_id', providerId)

    if (availability.length > 0) {
      const { error } = await supabase
        .from('provider_availability')
        .insert(availability.map(a => ({ ...a, provider_id: providerId })))

      if (error) throw error
    }
    return true
  } catch (error) {
    console.error('Error saving availability:', error)
    return false
  }
}

export async function checkAvailability(
  providerId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const targetDate = new Date(date)
  const dayOfWeek = targetDate.getDay()

  const { data: windows } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  if (!windows || windows.length === 0) return false

  let withinWindow = false
  for (const window of windows) {
    if (startTime >= window.start_time && endTime <= window.end_time) {
      withinWindow = true
      break
    }
  }
  if (!withinWindow) return false

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('provider_id', providerId)
    .eq('booking_date', date)
    .in('status', ['CONFIRMED', 'PENDING'])

  if (existingBookings) {
    for (const booking of existingBookings) {
      if (startTime < booking.end_time && endTime > booking.start_time) {
        return false
      }
    }
  }
  return true
}