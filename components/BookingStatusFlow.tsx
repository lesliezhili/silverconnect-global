'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Calendar, Clock, DollarSign, Check, X, Clock3 } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface BookingStatusFlowProps {
  booking: any;
  service: any;
  provider: any;
  user: any;
  language: Language;
  onStatusChange?: (newStatus: string) => void;
  onChatOpen?: () => void;
}

export default function BookingStatusFlow({
  booking,
  service,
  provider,
  user,
  language,
  onStatusChange,
  onChatOpen,
}: BookingStatusFlowProps) {
  const [status, setStatus] = useState(booking.status);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  const t = (key: string) => (translations[language] as any)[key] || key;

  const statusColors = {
    PENDING: 'bg-yellow-50 border-yellow-200',
    CONFIRMED: 'bg-blue-50 border-blue-200',
    COMPLETED: 'bg-green-50 border-green-200',
    CANCELLED: 'bg-red-50 border-red-200',
  };

  const statusIcons = {
    PENDING: <Clock3 className="text-yellow-600" size={20} />,
    CONFIRMED: <Check className="text-blue-600" size={20} />,
    COMPLETED: <Check className="text-green-600" size={20} />,
    CANCELLED: <X className="text-red-600" size={20} />,
  };

  const isProvider = user?.user_type === 'provider' || user?.id === provider?.user_id;
  const isCustomer = user?.id === booking.user_id;

  const handleAcceptBooking = async () => {
    setLoading(true);
    try {
      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CONFIRMED' })
        .eq('id', booking.id);

      if (error) throw error;

      // Log status change
      await supabase.from('booking_status_history').insert({
        booking_id: booking.id,
        old_status: 'PENDING',
        new_status: 'CONFIRMED',
        changed_by: user.id,
      });

      setStatus('CONFIRMED');
      onStatusChange?.('CONFIRMED');
    } catch (error) {
      console.error('Error accepting booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', booking.id);

      if (error) throw error;

      // Log status change with reason
      await supabase.from('booking_status_history').insert({
        booking_id: booking.id,
        old_status: 'PENDING',
        new_status: 'CANCELLED',
        changed_by: user.id,
        reason,
      });

      setStatus('CANCELLED');
      setShowReasonInput(false);
      onStatusChange?.('CANCELLED');
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBooking = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (error) throw error;

      await supabase.from('booking_status_history').insert({
        booking_id: booking.id,
        old_status: 'CONFIRMED',
        new_status: 'COMPLETED',
        changed_by: user.id,
      });

      setStatus('COMPLETED');
      onStatusChange?.('COMPLETED');
    } catch (error) {
      console.error('Error completing booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`border rounded-lg p-6 ${statusColors[status as keyof typeof statusColors]}`}>
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {statusIcons[status as keyof typeof statusIcons]}
          <h3 className="text-lg font-bold capitalize">{status.toLowerCase()}</h3>
        </div>
        <span className="text-sm text-gray-600">
          Booking #{booking.id.substring(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Service Details */}
      <div className="space-y-3 mb-6 pb-6 border-b">
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Service</p>
            <p className="font-semibold">{service?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Date</p>
              <p className="font-semibold">
                {new Date(booking.booking_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Time</p>
              <p className="font-semibold">{booking.booking_time}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold text-sm">{booking.address}</p>
          </div>
        </div>

        {booking.special_instructions && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Special Instructions</p>
            <p className="text-sm italic text-gray-700">{booking.special_instructions}</p>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-600">Total Price</span>
        <div className="flex items-center gap-1">
          <DollarSign size={20} className="text-green-600" />
          <span className="text-2xl font-bold">{booking.total_price}</span>
        </div>
      </div>

      {/* Provider Actions (for customers) */}
      {isCustomer && status === 'PENDING' && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">⏳ Waiting for provider to accept...</p>
        </div>
      )}

      {/* Provider Actions (for providers) */}
      {isProvider && status === 'PENDING' && (
        <>
          {!showReasonInput ? (
            <div className="flex gap-2">
              <button
                onClick={handleAcceptBooking}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
              >
                {loading ? 'Accepting...' : '✓ Accept Booking'}
              </button>
              <button
                onClick={() => setShowReasonInput(true)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
              >
                ✕ Decline
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you declining this booking?"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRejectBooking}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Declining...' : 'Confirm Decline'}
                </button>
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setReason('');
                  }}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Chat & Complete Buttons */}
      {(status === 'CONFIRMED' || status === 'COMPLETED') && (
        <div className="flex gap-2">
          <button
            onClick={onChatOpen}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            💬 Send Message
          </button>
          {isProvider && status === 'CONFIRMED' && (
            <button
              onClick={handleCompleteBooking}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Completing...' : '✓ Mark Complete'}
            </button>
          )}
        </div>
      )}

      {/* Completed State */}
      {status === 'COMPLETED' && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
          <p className="text-green-800 font-semibold">✓ Service completed successfully!</p>
          {isCustomer && (
            <p className="text-sm text-green-700 mt-1">You can now leave feedback for this service.</p>
          )}
        </div>
      )}

      {/* Cancelled State */}
      {status === 'CANCELLED' && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-center">
          <p className="text-red-800 font-semibold">✕ Booking cancelled</p>
        </div>
      )}
    </div>
  );
}
