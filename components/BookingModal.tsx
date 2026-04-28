'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface PricingInfo {
  basePrice: number;
  dayType: string;
  timeSlot: string;
  dayTypeMultiplier: number;
  finalPrice: number;
  currency: string;
  available: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  service: any;
  price: any;
  user: any;
  country: any;
  providerId?: string;
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
  providerId,
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
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const t = (key: string) => (translations[language] as any)[key] || key;

  // Fetch pricing when date/time changes
  useEffect(() => {
    if (date && time && providerId) {
      fetchPricing();
    }
  }, [date, time, providerId]);

  const fetchPricing = async () => {
    if (!date || !time || !providerId) return;
    
    setPricingLoading(true);
    try {
      const params = new URLSearchParams({
        service_id: service?.id || 'cleaning',
        provider_id: providerId,
        country_code: country || 'AU',
        booking_date: date,
        booking_time: time,
        duration: '2',
      });
      
      const response = await fetch(`/api/pricing?${params}`);
      const data = await response.json();
      
      if (data.finalPrice !== undefined) {
        setPricing({
          basePrice: data.basePrice,
          dayType: data.dayType,
          timeSlot: data.timeSlot,
          dayTypeMultiplier: data.dayTypeMultiplier,
          finalPrice: data.finalPrice,
          currency: data.currency || (country === 'CA' ? 'CAD' : 'AUD'),
          available: data.available,
        });
      }
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
    } finally {
      setPricingLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    return country === 'CA' ? 'C$' : 'A$';
  };

  const formatPrice = (amount: number) => {
    return `${getCurrencySymbol()}${amount.toFixed(2)}`;
  };

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
          
          {/* Dynamic Pricing Breakdown */}
          {pricingLoading ? (
            <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
              <span className="text-gray-600">Calculating price...</span>
              <div className="animate-pulse bg-gray-300 h-6 w-20 rounded"></div>
            </div>
          ) : pricing ? (
            <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Price:</span>
                <span>{formatPrice(pricing.basePrice)}</span>
              </div>
              {pricing.dayTypeMultiplier !== 1 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>{pricing.dayType} Rate ({pricing.dayTypeMultiplier}x):</span>
                  <span>+{formatPrice(pricing.basePrice * (pricing.dayTypeMultiplier - 1))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatPrice(pricing.finalPrice)}</span>
              </div>
              {!pricing.available && (
                <div className="p-2 bg-red-100 text-red-700 text-xs rounded">
                  ⚠️ Provider not available at selected time
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between">
              <span className="text-gray-600">{t('duration')}: {service.duration_minutes} min</span>
              <span className="font-bold text-lg">
                {country === 'CN' ? '¥' : '$'}{price.price_with_tax}
              </span>
            </div>
          )}
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
