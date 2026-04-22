'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface BookingModalProps {
  isOpen: boolean;
  service: any;
  price: any;
  user: any;
  country: any;
  onClose: () => void;
  onSuccess: (data?: { booking: any; provider: any; price: number }) => void;
  language?: Language;
}

export default function BookingModal({
  isOpen,
  service,
  price,
  user,
  country,
  onClose,
  onSuccess,
  language = 'en',
}: BookingModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = (key: string) => translations[language][key as keyof typeof translations.en] || key;

  if (!isOpen || !service || !user) return null;

  // Get tomorrow as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  async function handleBook() {
    if (!date || !time || !address) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get user's location coordinates (simplified - in production use geocoding service)
      const latitude = user.latitude || null;
      const longitude = user.longitude || null;

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          serviceId: service.id,
          countryCode: country,
          bookingDate: date,
          bookingTime: time,
          address,
          latitude,
          longitude,
          specialInstructions: instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const { booking, provider, price: finalPrice } = await response.json();

      // Update local state with booking details
      setDate('');
      setTime('');
      setAddress('');
      setInstructions('');

      // Call success callback with booking and provider info
      onSuccess({
        booking,
        provider,
        price: finalPrice,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('bookService')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Service Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-semibold text-lg">{service.name}</p>
          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
          <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between">
            <span className="text-gray-600">{t('duration')}: {service.duration_minutes} min</span>
            <span className="font-bold text-lg">
              {country === 'CN' ? '¥' : '$'}{price.price_with_tax}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" /> {t('date')} *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock className="w-4 h-4" /> {t('time')} *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin className="w-4 h-4" /> {t('address')} *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('address')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('specialInstructionsOptional')}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('specialInstructionsOptional')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleBook}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {loading ? t('booking') || 'Booking...' : t('confirmBooking')}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            {t('bookingNotification') || 'You will receive a confirmation email once the booking is accepted'}
          </p>
        </div>
      </div>
    </div>
  );
}
