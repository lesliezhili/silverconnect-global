'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Clock } from 'lucide-react'

interface TimeWindow {
  id?: string
  day_of_week: number
  slot_name: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  is_available: boolean
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const SLOT_NAMES = ['Morning', 'Afternoon', 'Evening', 'Night']
const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

interface ProviderAvailabilityProps {
  providerId?: string
  editable?: boolean
  onSave?: () => void
}

export default function ProviderAvailability({ providerId, editable = true, onSave }: ProviderAvailabilityProps) {
  const [availability, setAvailability] = useState<TimeWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (providerId) {
      loadAvailability()
    }
  }, [providerId])

  const loadAvailability = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/provider/availability?providerId=${providerId}`)
      const data = await response.json()
      if (data.flat_availability && data.flat_availability.length > 0) {
        setAvailability(data.flat_availability)
      } else {
        // Add default availability for each day
        const defaultAvailability: TimeWindow[] = []
        for (const day of DAYS) {
          if (day.value !== 0 && day.value !== 6) { // Weekdays only
            defaultAvailability.push({
              day_of_week: day.value,
              slot_name: 'Morning',
              start_time: '09:00',
              end_time: '17:00',
              break_duration_minutes: 15,
              is_available: true
            })
          }
        }
        setAvailability(defaultAvailability)
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTimeWindow = () => {
    setAvailability([
      ...availability,
      {
        day_of_week: 1,
        slot_name: 'Morning',
        start_time: '09:00',
        end_time: '12:00',
        break_duration_minutes: 15,
        is_available: true
      }
    ])
  }

  const removeTimeWindow = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index))
  }

  const updateWindow = (index: number, field: keyof TimeWindow, value: any) => {
    const updated = [...availability]
    updated[index] = { ...updated[index], [field]: value }
    setAvailability(updated)
  }

  const handleSave = async () => {
    if (!editable) return
    setSaving(true)
    try {
      const response = await fetch('/api/provider/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability, mode: 'replace' })
      })
      if (response.ok) {
        alert('Availability saved successfully!')
        onSave?.()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save availability')
      }
    } catch (error) {
      alert('Error saving availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading availability...</div>
  }

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Availability Schedule</h3>
          <button
            onClick={addTimeWindow}
            className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Time Window
          </button>
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {availability.map((window, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${window.is_available ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
          >
            {editable ? (
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={window.day_of_week}
                  onChange={(e) => updateWindow(idx, 'day_of_week', parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {DAYS.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>

                <select
                  value={window.slot_name}
                  onChange={(e) => updateWindow(idx, 'slot_name', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {SLOT_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                <select
                  value={window.start_time}
                  onChange={(e) => updateWindow(idx, 'start_time', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>

                <span className="text-gray-500 text-sm">to</span>

                <select
                  value={window.end_time}
                  onChange={(e) => updateWindow(idx, 'end_time', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <input
                    type="number"
                    value={window.break_duration_minutes}
                    onChange={(e) => updateWindow(idx, 'break_duration_minutes', parseInt(e.target.value))}
                    className="w-16 px-1 py-1 border border-gray-300 rounded-lg text-sm"
                    min="0"
                    step="5"
                  />
                  <span className="text-xs text-gray-500">min break</span>
                </div>

                <label className="flex items-center gap-1 ml-auto">
                  <input
                    type="checkbox"
                    checked={window.is_available}
                    onChange={(e) => updateWindow(idx, 'is_available', e.target.checked)}
                    className="rounded accent-green-600"
                  />
                  <span className="text-sm text-gray-600">Available</span>
                </label>

                <button
                  onClick={() => removeTimeWindow(idx)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{DAYS.find(d => d.value === window.day_of_week)?.label}</span>
                  <span className="mx-2">•</span>
                  <span className="text-gray-600">{window.slot_name}</span>
                  <span className="mx-2">•</span>
                  <span className="text-gray-600">{window.start_time} - {window.end_time}</span>
                  <span className="ml-2 text-xs text-gray-400">({window.break_duration_minutes} min break)</span>
                </div>
                {window.is_available ? (
                  <span className="text-green-600 text-sm">Available</span>
                ) : (
                  <span className="text-gray-400 text-sm">Unavailable</span>
                )}
              </div>
            )}
          </div>
        ))}

        {availability.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No availability set. Click "Add Time Window" to get started.
          </div>
        )}
      </div>

      {editable && availability.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      )}

      {editable && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Multiple Windows Per Day</p>
          <p className="text-xs">Add multiple time windows for each day. Break time is automatically added between consecutive bookings.</p>
        </div>
      )}
    </div>
  )
}