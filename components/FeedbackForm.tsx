// filepath: components/FeedbackForm.tsx
"use client";

import { useState } from "react";

interface FeedbackFormProps {
  bookingId: string;
  providerId: string;
  onSubmit?: (feedback: any) => void;
}

export default function FeedbackForm({ bookingId, providerId, onSubmit }: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 5,
    communication_rating: 5,
    reliability_rating: 5,
    quality_rating: 5,
    comment: "",
    would_recommend: true,
  });

  const handleRatingChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          provider_id: providerId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      if (onSubmit) {
        onSubmit(data.feedback);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-2xl transition-transform hover:scale-110"
        >
          {star <= value ? (
            <span className="text-yellow-400">★</span>
          ) : (
            <span className="text-gray-300">★</span>
          )}
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 rounded-lg text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-semibold text-green-900">Thank you for your feedback!</h3>
        <p className="text-green-700 mt-2">Your review helps other customers make informed decisions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Rate Your Experience</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating
          </label>
          <RatingStars
            value={formData.rating}
            onChange={(v) => handleRatingChange("rating", v)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Communication
            </label>
            <RatingStars
              value={formData.communication_rating}
              onChange={(v) => handleRatingChange("communication_rating", v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Reliability
            </label>
            <RatingStars
              value={formData.reliability_rating}
              onChange={(v) => handleRatingChange("reliability_rating", v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quality
            </label>
            <RatingStars
              value={formData.quality_rating}
              onChange={(v) => handleRatingChange("quality_rating", v)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments (optional)
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
            rows={4}
            placeholder="Share your experience..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.would_recommend}
              onChange={(e) => setFormData((prev) => ({ ...prev, would_recommend: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">I would recommend this provider to others</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}