"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface JobExecution {
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMin: number | null;
  startNotes: string | null;
  endNotes: string | null;
}

interface Photo {
  id: string;
  photo_type: string;
  photo_url: string;
  caption: string;
  taken_at: string;
}

interface Booking {
  id: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  total_price: number;
  notes: string;
  customer_name?: string;
}

export default function JobExecutionPage() {
  const t = useTranslations("common");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [execution, setExecution] = useState<JobExecution | null>(null);
  const [photos, setPhotos] = useState<{ before: Photo[]; after: Photo[]; total: number }>({ before: [], after: [], total: 0 });
  const [gps, setGps] = useState<{ sharingEnabled: boolean; lat: number; lng: number } | null>(null);
  const [gpsToggle, setGpsToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get current GPS location
  const getCurrentPosition = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCurrentLocation({ lat: -31.9505, lng: 115.8605 }) // fallback Perth
      );
    }
  }, []);

  useEffect(() => { getCurrentPosition(); }, [getCurrentPosition]);

  // Fetch active bookings for provider
  const fetchBookings = useCallback(async () => {
    try {
      const providerId = "d73656c1-bde8-47cf-a86b-924453f88072";
      const res = await fetch(`/api/provider/dashboard?providerId=${providerId}`);
      const data = await res.json();
      if (data.todayBookings) setBookings(data.todayBookings);
    } catch { /* fallback: no bookings */ }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Fetch execution status for selected booking
  const fetchExecution = useCallback(async (bookingId: string) => {
    try {
      const res = await fetch(`/api/provider/job-execution?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setExecution(data.execution);
        setPhotos(data.photos || { before: [], after: [], total: 0 });
        setGps(data.gps);
        setGpsToggle(data.gps?.sharingEnabled || false);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (selectedBooking) fetchExecution(selectedBooking); }, [selectedBooking, fetchExecution]);

  // Start job
  const startJob = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    const providerId = "d73656c1-bde8-47cf-a86b-924453f88072";
    const photosList = photoUrl ? [{ url: photoUrl, caption: photoCaption || "Before" }] : [];
    const res = await fetch("/api/provider/job-execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: selectedBooking, providerId, action: "start", latitude: currentLocation?.lat, longitude: currentLocation?.lng, notes, photos: photosList }),
    });
    const data = await res.json();
    if (data.success) { setNotes(""); setPhotoUrl(""); setPhotoCaption(""); fetchExecution(selectedBooking); }
    setLoading(false);
  };

  // Complete job
  const completeJob = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    const providerId = "d73656c1-bde8-47cf-a86b-924453f88072";
    const photosList = photoUrl ? [{ url: photoUrl, caption: photoCaption || "After" }] : [];
    const res = await fetch("/api/provider/job-execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: selectedBooking, providerId, action: "complete", latitude: currentLocation?.lat, longitude: currentLocation?.lng, notes, photos: photosList }),
    });
    const data = await res.json();
    if (data.success) { setNotes(""); setPhotoUrl(""); setPhotoCaption(""); fetchExecution(selectedBooking); }
    setLoading(false);
  };

  // Toggle GPS
  const toggleGps = async () => {
    if (!selectedBooking) return;
    const newState = !gpsToggle;
    const providerId = "d73656c1-bde8-47cf-a86b-924453f88072";
    await fetch("/api/provider/location", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: selectedBooking, providerId, enabled: newState }),
    });
    setGpsToggle(newState);
    // Also update location if enabling
    if (newState && currentLocation) {
      await fetch("/api/provider/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBooking, providerId, latitude: currentLocation.lat, longitude: currentLocation.lng, enabled: true }),
      });
    }
  };

  const jobStatus = execution?.status || "not_started";

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">&#128221;</span> Job Execution
        </h1>
        <p className="text-sm text-gray-500 mt-1">Start/end jobs with photo evidence &amp; GPS tracking</p>
      </div>

      {/* Booking Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">Select Booking</label>
        <select
          className="w-full p-3 border border-gray-200 rounded-lg text-sm"
          value={selectedBooking || ""}
          onChange={(e) => setSelectedBooking(e.target.value || null)}
        >
          <option value="">-- Select a booking --</option>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {new Date(b.scheduled_at).toLocaleDateString()} - ${b.total_price} ({b.status})
            </option>
          ))}
          {bookings.length === 0 && <option value="" disabled>No active bookings today</option>}
        </select>
      </div>

      {selectedBooking && (
        <>
          {/* Status Badge */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">Job Status</span>
                <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  jobStatus === "completed" ? "bg-green-100 text-green-700" :
                  jobStatus === "in_progress" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  <span>{jobStatus === "completed" ? "\u2705" : jobStatus === "in_progress" ? "\ud83d\udfe2" : "\u23f3"}</span>
                  {jobStatus === "completed" ? "Completed" : jobStatus === "in_progress" ? "In Progress" : "Not Started"}
                </div>
              </div>
              {execution?.durationMin && (
                <div className="text-right">
                  <span className="text-sm text-gray-500">Duration</span>
                  <p className="text-lg font-bold text-gray-900">{execution.durationMin} min</p>
                </div>
              )}
            </div>
          </div>

          {/* GPS Toggle */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">&#128205;</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">GPS Location Sharing</p>
                  <p className="text-xs text-gray-500">Customer can see your live location</p>
                </div>
              </div>
              <button
                onClick={toggleGps}
                className={`relative w-12 h-6 rounded-full transition-colors ${gpsToggle ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gpsToggle ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            {currentLocation && (
              <p className="text-xs text-gray-400 mt-2">Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <span>&#128247;</span> Photo Evidence
            </p>
            <input
              type="text"
              placeholder="Photo URL (or use camera upload)"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-2"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Caption (e.g., Kitchen before cleaning)"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
            <textarea
              placeholder={jobStatus === "not_started" ? "Arrival notes..." : "Completion notes..."}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-4">
            {jobStatus === "not_started" && (
              <button
                onClick={startJob}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>&#9654;&#65039;</span> {loading ? "Starting..." : "Start Job"}
              </button>
            )}
            {jobStatus === "in_progress" && (
              <button
                onClick={completeJob}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>&#9989;</span> {loading ? "Completing..." : "Complete Job"}
              </button>
            )}
            {jobStatus === "completed" && (
              <div className="w-full py-3 bg-green-50 text-green-700 font-semibold rounded-xl text-center border border-green-200">
                &#9989; Job Completed {execution?.durationMin ? `(${execution.durationMin} min)` : ""}
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          {photos.total > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Photo Evidence ({photos.total})</p>
              {photos.before.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Before</p>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.before.map((p) => (
                      <div key={p.id} className="bg-gray-100 rounded-lg p-2">
                        <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-2xl">&#128247;</div>
                        <p className="text-xs text-gray-600 mt-1 truncate">{p.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {photos.after.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">After</p>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.after.map((p) => (
                      <div key={p.id} className="bg-gray-100 rounded-lg p-2">
                        <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-2xl">&#128247;</div>
                        <p className="text-xs text-gray-600 mt-1 truncate">{p.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {execution && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Timeline</p>
              <div className="space-y-3">
                {execution.startedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Job Started</p>
                      <p className="text-xs text-gray-500">{new Date(execution.startedAt).toLocaleString()}</p>
                      {execution.startNotes && <p className="text-xs text-gray-600 mt-0.5">{execution.startNotes}</p>}
                    </div>
                  </div>
                )}
                {execution.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Job Completed</p>
                      <p className="text-xs text-gray-500">{new Date(execution.completedAt).toLocaleString()}</p>
                      {execution.endNotes && <p className="text-xs text-gray-600 mt-0.5">{execution.endNotes}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center mt-6">Powered by PHLedger</p>
    </div>
  );
}
