"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface ProviderLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
  ageSeconds: number;
  isStale: boolean;
}

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

export default function TrackProviderPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const [location, setLocation] = useState<ProviderLocation | null>(null);
  const [execution, setExecution] = useState<JobExecution | null>(null);
  const [photos, setPhotos] = useState<{ before: Photo[]; after: Photo[]; total: number }>({ before: [], after: [], total: 0 });
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`/api/provider/location?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setLocation(data.location);
        setError("");
      } else {
        setError(data.error || "Failed to fetch");
      }
      setLastRefresh(new Date());
    } catch { setError("Network error"); }
  }, [bookingId]);

  const fetchExecution = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`/api/provider/job-execution?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setExecution(data.execution);
        setPhotos(data.photos || { before: [], after: [], total: 0 });
      }
    } catch { /* ignore */ }
  }, [bookingId]);

  // Initial fetch
  useEffect(() => { fetchLocation(); fetchExecution(); }, [fetchLocation, fetchExecution]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (autoRefresh && bookingId) {
      intervalRef.current = setInterval(() => { fetchLocation(); fetchExecution(); }, 10000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, bookingId, fetchLocation, fetchExecution]);

  const jobStatus = execution?.status || "not_started";

  // Generate static map URL (OpenStreetMap embed)
  const mapUrl = location
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005}%2C${location.latitude - 0.003}%2C${location.longitude + 0.005}%2C${location.latitude + 0.003}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`
    : null;

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-sm text-center">
          <span className="text-4xl">&#128205;</span>
          <h2 className="text-lg font-bold text-gray-900 mt-3">Track Your Provider</h2>
          <p className="text-sm text-gray-500 mt-2">Open this page from your active booking to see live provider location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 rounded-b-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              &#128205; Live Tracking
            </h1>
            <p className="text-emerald-100 text-xs mt-0.5">Real-time provider location</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 rounded-full text-xs font-medium ${autoRefresh ? "bg-emerald-500 text-white" : "bg-white/20 text-white"}`}
            >
              {autoRefresh ? "&#9899; Live" : "&#9898; Paused"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Job Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                jobStatus === "completed" ? "bg-green-500" :
                jobStatus === "in_progress" ? "bg-blue-500 animate-pulse" :
                "bg-gray-300"
              }`}></span>
              <span className="text-sm font-medium text-gray-900">
                {jobStatus === "completed" ? "Service Completed" :
                 jobStatus === "in_progress" ? "Service In Progress" :
                 "Waiting for Provider"}
              </span>
            </div>
            {execution?.durationMin && (
              <span className="text-sm font-bold text-emerald-600">{execution.durationMin} min</span>
            )}
          </div>
          {execution?.startedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Started: {new Date(execution.startedAt).toLocaleTimeString()}
              {execution.completedAt && ` | Completed: ${new Date(execution.completedAt).toLocaleTimeString()}`}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {location ? (
            <>
              <iframe
                src={mapUrl || ""}
                className="w-full h-64 border-0"
                loading="lazy"
                title="Provider Location"
              ></iframe>
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Provider Location</p>
                    <p className="text-sm font-mono text-gray-700">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className={`text-sm font-medium ${location.isStale ? "text-orange-500" : "text-emerald-600"}`}>
                      {location.isStale ? `${Math.round(location.ageSeconds / 60)}m ago &#9888;&#65039;` : `${location.ageSeconds}s ago`}
                    </p>
                  </div>
                </div>
                {location.accuracy && (
                  <p className="text-xs text-gray-400 mt-1">Accuracy: &#177;{location.accuracy}m</p>
                )}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <span className="text-3xl">&#128205;</span>
                <p className="text-sm text-gray-500 mt-2">
                  {error || "Provider hasn't shared their location yet"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Location updates automatically when shared</p>
              </div>
            </div>
          )}
        </div>

        {/* ETA / Status Info */}
        {location && !location.isStale && jobStatus !== "completed" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span>&#128663;</span>
              <p className="text-sm text-blue-800 font-medium">
                {jobStatus === "in_progress" ? "Your provider is working on your service" : "Your provider is on their way"}
              </p>
            </div>
          </div>
        )}

        {location && location.isStale && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span>&#9888;&#65039;</span>
              <p className="text-sm text-orange-800">
                Location data is {Math.round(location.ageSeconds / 60)} minutes old. Provider may have paused sharing.
              </p>
            </div>
          </div>
        )}

        {/* Photo Evidence */}
        {photos.total > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
              &#128247; Service Photos ({photos.total})
            </h3>
            {photos.before.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Before</p>
                <div className="grid grid-cols-2 gap-2">
                  {photos.before.map((p) => (
                    <div key={p.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center text-xl">&#128247;</div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{p.caption}</p>
                      <p className="text-xs text-gray-400">{new Date(p.taken_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {photos.after.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">After</p>
                <div className="grid grid-cols-2 gap-2">
                  {photos.after.map((p) => (
                    <div key={p.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <div className="w-full h-16 bg-green-100 rounded flex items-center justify-center text-xl">&#9989;</div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{p.caption}</p>
                      <p className="text-xs text-gray-400">{new Date(p.taken_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Info */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {lastRefresh ? `Last refresh: ${lastRefresh.toLocaleTimeString()}` : ""}
          </p>
          <button
            onClick={() => { fetchLocation(); fetchExecution(); }}
            className="text-xs text-emerald-600 font-medium hover:underline"
          >
            Refresh now
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center pt-2 pb-4">
          Powered by PHLedger &#183; Location updates every 10 seconds
        </p>
      </div>
    </div>
  );
}
