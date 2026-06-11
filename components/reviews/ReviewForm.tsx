"use client";

import { useState } from "react";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3 justify-center my-6">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange(star)}
          className="text-5xl transition-transform active:scale-110 focus:outline-none"
          aria-label={star + " star" + (star > 1 ? "s" : "")}>
          {star <= value ? "\u2B50" : "\u2606"}
        </button>
      ))}
    </div>
  );
}

interface Props { bookingId: string; onSuccess?: () => void; }

export default function ReviewForm({ bookingId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickComments = [
    "Excellent work!",
    "Friendly and professional.",
    "On time and reliable.",
    "Left everything spotless.",
    "Would book again!",
  ];

  const submit = async () => {
    if (rating === 0) { setError("Please select a rating"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/bookings/" + bookingId + "/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); onSuccess?.(); }
      else setError(data.error || "Something went wrong");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">\ud83c\udf1f</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
        <p className="text-lg text-gray-600">Your review helps other seniors find great helpers.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"><p className="text-red-700 text-lg">{error}</p></div>}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-center mb-2">Tap to Rate</h2>
        <StarRating value={rating} onChange={setRating} />
        <p className="text-center text-lg text-gray-500">
          {rating === 0 ? "Select a rating" : rating === 5 ? "Outstanding!" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Quick Feedback</h2>
        <div className="flex flex-wrap gap-2">
          {quickComments.map((qc) => (
            <button key={qc} onClick={() => setComment(prev => prev ? prev + " " + qc : qc)}
              className={"px-4 py-3 rounded-full text-base font-medium min-h-[48px] " +
                (comment.includes(qc) ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300" : "bg-gray-100 text-gray-700 border border-gray-200")}>
              {qc}
            </button>
          ))}
        </div>
      </div>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us about your experience..." rows={3}
        className="w-full p-4 border border-gray-300 rounded-xl text-lg resize-none mb-6" />

      <button onClick={submit} disabled={loading || rating === 0}
        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px] shadow-lg">
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
