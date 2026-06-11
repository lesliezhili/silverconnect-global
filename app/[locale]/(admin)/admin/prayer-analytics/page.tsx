"use client";

import { useState, useEffect, Suspense } from "react";

interface Overview { totalReports: number; totalAttendees: number; followUpsNeeded: number; activeVolunteers: number; seniorsServed: number; }

function PrayerAnalyticsContent() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/prayer-analytics")
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-xl">Loading analytics...</div>;
  if (!data) return <div className="p-6 text-center text-xl text-red-500">Failed to load.</div>;

  const ov = data.overview as Overview;
  const moods = data.moodDistribution as { mood: string; count: number }[];
  const topics = data.topPrayerTopics as { topic: string; count: number }[];
  const scriptures = data.topScriptures as { scripture: string; count: number }[];
  const volunteers = data.topVolunteers as { name: string; reports: number; attendees: number }[];
  const followUps = data.pendingFollowUps as { volunteer_name: string; customer_name: string; mood: string; follow_up_notes: string; created_at: string }[];

  const moodEmoji: Record<string, string> = { joyful: "\ud83d\ude0a", peaceful: "\u262e\ufe0f", struggling: "\ud83d\ude1f", grieving: "\ud83d\ude22" };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Prayer Report Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{ov.totalReports}</p>
          <p className="text-sm text-purple-600">Reports</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{ov.totalAttendees}</p>
          <p className="text-sm text-blue-600">Attendees</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{ov.activeVolunteers}</p>
          <p className="text-sm text-green-600">Volunteers</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{ov.seniorsServed}</p>
          <p className="text-sm text-emerald-600">Seniors Served</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{ov.followUpsNeeded}</p>
          <p className="text-sm text-amber-600">Follow-ups</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">Senior Mood (After Visit)</h2>
          {moods.length === 0 ? <p className="text-gray-400">No data yet</p> : (
            <div className="space-y-3">
              {moods.map(m => (
                <div key={m.mood} className="flex items-center justify-between">
                  <span className="text-lg">{moodEmoji[m.mood] || ""} {m.mood}</span>
                  <span className="text-lg font-bold">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Prayer Topics */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">\ud83d\ude4f Top Prayer Topics</h2>
          {topics.length === 0 ? <p className="text-gray-400">No data yet</p> : (
            <div className="space-y-2">
              {topics.map(t => (
                <div key={t.topic} className="flex items-center justify-between">
                  <span className="text-base">{t.topic}</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Scriptures */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">\ud83d\udcd6 Most Shared Scriptures</h2>
          {scriptures.length === 0 ? <p className="text-gray-400">No data yet</p> : (
            <div className="space-y-2">
              {scriptures.map(s => (
                <div key={s.scripture} className="flex items-center justify-between">
                  <span className="text-base italic">{s.scripture}</span>
                  <span className="text-sm text-gray-500">{s.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Volunteers */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">\u2b50 Top Volunteers</h2>
          {volunteers.length === 0 ? <p className="text-gray-400">No data yet</p> : (
            <div className="space-y-2">
              {volunteers.map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-base font-medium">{v.name}</span>
                  <span className="text-sm text-gray-500">{v.reports} visits &bull; {v.attendees} attendees</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Follow-ups */}
      {followUps.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">\u26a0\ufe0f Pending Follow-ups</h2>
          <div className="space-y-3">
            {followUps.map((f, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-medium">{f.customer_name} {f.mood ? moodEmoji[f.mood] || "" : ""}</p>
                    <p className="text-base text-gray-600">{f.follow_up_notes || "Follow-up recommended"}</p>
                    <p className="text-sm text-gray-400 mt-1">Volunteer: {f.volunteer_name} &bull; {new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function PrayerAnalyticsPage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><PrayerAnalyticsContent /></Suspense>;
}
