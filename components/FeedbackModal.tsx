'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, X, ThumbsUp } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface FeedbackModalProps {
  isOpen: boolean;
  booking: any;
  userType: 'customer' | 'provider';
  user: any;
  onClose: () => void;
  onSuccess: () => void;
  language?: Language;
}

export default function FeedbackModal({
  isOpen,
  booking,
  userType,
  user,
  onClose,
  onSuccess,
  language = 'en',
}: FeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [criteriaRatings, setCriteriaRatings] = useState({
    criteria1: 5, // punctuality or customer prep
    criteria2: 5, // professionalism or accessibility
    criteria3: 5, // quality or communication
  });
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = (key: string) => translations[language][key as keyof typeof translations.en] || key;

  if (!isOpen || !booking || !user) return null;

  const isCustomer = userType === 'customer';
  const criteria = isCustomer
    ? [
        { key: 'criteria1', label: 'Punctuality' },
        { key: 'criteria2', label: 'Professionalism' },
        { key: 'criteria3', label: 'Quality of Work' },
      ]
    : [
        { key: 'criteria1', label: 'Customer Preparation' },
        { key: 'criteria2', label: 'Home Accessibility' },
        { key: 'criteria3', label: 'Communication' },
      ];

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      if (isCustomer) {
        // Customer feedback on provider
        const { error: feedError } = await supabase
          .from('customer_feedback')
          .insert({
            booking_id: booking.id,
            customer_id: user.id,
            provider_id: booking.provider_id, // Assuming this field exists
            rating,
            review,
            punctuality_rating: criteriaRatings.criteria1,
            professionalism_rating: criteriaRatings.criteria2,
            quality_rating: criteriaRatings.criteria3,
            would_rebook: wouldRecommend,
          });

        if (feedError) throw feedError;
      } else {
        // Provider feedback on customer
        const { error: feedError } = await supabase
          .from('provider_feedback')
          .insert({
            booking_id: booking.id,
            provider_id: user.id,
            customer_id: booking.user_id,
            rating,
            review,
            customer_preparation_rating: criteriaRatings.criteria1,
            accessibility_rating: criteriaRatings.criteria2,
            communication_rating: criteriaRatings.criteria3,
            would_service_again: wouldRecommend,
          });

        if (feedError) throw feedError;
      }

      onSuccess();
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
          <h2 className="text-2xl font-bold">
            {isCustomer ? 'Rate Your Experience' : 'Rate Customer Experience'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Service Info */}
        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <p className="font-semibold text-sm">{isCustomer ? 'Service completed' : 'Booking information'}</p>
          <p className="text-gray-600 text-xs mt-1">Date: {booking.booking_date}</p>
        </div>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium mb-3">Overall Rating</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm mt-2 text-gray-600">
              {rating} / 5 stars
            </p>
          </div>

          {/* Criteria Ratings */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-3 block">Detailed Ratings</label>
            {criteria.map((c) => (
              <div key={c.key} className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{c.label}</span>
                  <span className="text-sm font-semibold">{criteriaRatings[c.key as keyof typeof criteriaRatings]}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setCriteriaRatings({
                          ...criteriaRatings,
                          [c.key]: star,
                        })
                      }
                      className="flex-1"
                    >
                      <Star
                        className={`w-5 h-5 mx-auto ${
                          star <= criteriaRatings[c.key as keyof typeof criteriaRatings]
                            ? 'fill-blue-400 text-blue-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>

          {/* Would Recommend */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                {isCustomer ? 'I would rebook this provider' : 'I would service this customer again'}
              </span>
            </label>
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
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
