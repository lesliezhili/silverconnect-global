'use client'

import { useState } from 'react'
import { X, Star } from 'lucide-react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  type: 'customer' | 'provider'
  onSubmit: () => void
}

export default function FeedbackModal({ isOpen, onClose, bookingId, type, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [punctuality, setPunctuality] = useState(0)
  const [professionalism, setProfessionalism] = useState(0)
  const [quality, setQuality] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide a rating')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          review,
          punctuality,
          professionalism,
          quality,
          type
        })
      })

      if (response.ok) {
        alert('Thank you for your feedback!')
        onSubmit()
        onClose()
      } else {
        alert('Failed to submit feedback')
      }
    } catch (error) {
      alert('Error submitting feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {type === 'customer' ? 'Rate Your Experience' : 'Rate the Customer'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Rating Stars */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Ratings for Customer Feedback */}
          {type === 'customer' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Punctuality</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setPunctuality(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= punctuality
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Professionalism</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setProfessionalism(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= professionalism
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Service Quality</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setQuality(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= quality
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={type === 'customer' ? 'Share your experience with this provider...' : 'Share your experience with this customer...'}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}