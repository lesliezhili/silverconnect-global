'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface TimeSlot {
  start_time: string
  end_time: string
  slot_name: string
  price?: number
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  providerId: string
  providerName: string
  serviceId: string
  serviceName: string
  onBookingComplete: () => void
}

export default function BookingModal({
  isOpen,
  onClose,
  providerId,
  providerName,
  serviceId,
  serviceName,
  onBookingComplete
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [groupedSlots, setGroupedSlots] = useState<Record<string, TimeSlot[]>>({})
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [address, setAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !selectedDate || !providerId) {
      return
    }

    const loadSlots = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/provider/availability?providerId=${providerId}&date=${selectedDate}&duration=60`)
        const data = await response.json()
        const slots: TimeSlot[] = data.slots || []
        setTimeSlots(slots)
        const grouped = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
          const key = slot.slot_name || 'Available'
          if (!acc[key]) acc[key] = []
          acc[key].push(slot)
          return acc
        }, {})
        setGroupedSlots(grouped)
      } catch (error) {
        console.error('Error fetching slots:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSlots()
  }, [isOpen, selectedDate, providerId])

  async function handleBooking() {
    if (!selectedSlot || !selectedDate) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          service_type: serviceId,
          date: selectedDate,
          start_time: selectedSlot.start_time,
          duration_minutes: 60,
          address,
          notes: specialInstructions
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Booking created successfully! Please complete payment.')
        onBookingComplete()
        onClose()
      } else {
        alert(data.error || 'Failed to create booking')
      }
    } catch {
      alert('Error creating booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Book Service</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Service Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Service</p>
            <p className="font-medium">{serviceName}</p>
            <p className="text-sm text-gray-500 mt-1">Provider: {providerName}</p>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Time</label>
              {loading ? (
                <div className="text-center py-4">Loading slots...</div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No available slots for this date</div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(groupedSlots).map(([slotName, slots]) => (
                    <div key={slotName}>
                      <p className="text-xs text-gray-500 mb-1">{slotName}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2 border rounded-lg text-center text-sm transition ${
                              selectedSlot === slot
                                ? 'bg-green-600 text-white border-green-600'
                                : 'hover:border-green-400'
                            }`}
                          >
                            {slot.start_time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">Service Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium mb-1">Special Instructions (Optional)</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or notes for the provider"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Price Summary */}
          {selectedSlot && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Price:</span>
                <span className="text-xl font-bold text-green-700">
                  ${totalPrice || 60}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Includes 15% platform fee
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={handleBooking}
            disabled={!selectedSlot || !address || submitting}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}