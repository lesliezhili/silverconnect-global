"use client";

import { useState, useEffect, Suspense } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  { label: "Morning (8-12)", start: 8, end: 12 },
  { label: "Afternoon (12-17)", start: 12, end: 17 },
  { label: "Evening (17-20)", start: 17, end: 20 },
];

interface Slot { dayOfWeek: number; startHour: number; endHour: number; }

function ScheduleContent() {
  const [selected, setSelected] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    fetch("/api/provider/faith-schedule")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.schedule) {
          setSelected(data.schedule.map((s: { day_of_week: number; start_hour: number; end_hour: number }) => ({
            dayOfWeek: s.day_of_week, startHour: s.start_hour, endHour: s.end_hour,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSchedule(false));
  }, []);

  const isSelected = (day: number, start: number, end: number) =>
    selected.some(s => s.dayOfWeek === day && s.startHour === start && s.endHour === end);

  const toggle = (day: number, start: number, end: number) => {
    if (isSelected(day, start, end)) {
      setSelected(prev => prev.filter(s => !(s.dayOfWeek === day && s.startHour === start)));
    } else {
      setSelected(prev => [...prev, { dayOfWeek: day, startHour: start, endHour: end }]);
    }
    setSaved(false);
  };

  const save = async () => {
    setLoading(true);
    const res = await fetch("/api/provider/faith-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: selected }),
    });
    const data = await res.json();
    if (data.success) setSaved(true);
    setLoading(false);
  };

  if (loadingSchedule) return <div className="p-6 text-center text-xl">Loading schedule...</div>;

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Availability</h1>
        <p className="text-lg text-gray-500 mt-1">Tap the times you can serve each week</p>
      </div>

      <div className="space-y-4">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{day}</h3>
            <div className="flex gap-2 flex-wrap">
              {TIME_SLOTS.map(ts => (
                <button key={ts.label} onClick={() => toggle(dayIdx, ts.start, ts.end)}
                  className={"px-4 py-3 rounded-xl text-base font-medium min-h-[48px] border-2 transition-colors " +
                    (isSelected(dayIdx, ts.start, ts.end)
                      ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                      : "bg-gray-50 border-gray-200 text-gray-600")}>
                  {ts.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-center text-lg text-gray-500">
          {selected.length} slot{selected.length !== 1 ? "s" : ""} selected
        </p>
        <button onClick={save} disabled={loading || selected.length === 0}
          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl min-h-[64px]">
          {loading ? "Saving..." : saved ? "\u2713 Saved!" : "Save Schedule"}
        </button>
      </div>
    </main>
  );
}

export default function FaithSchedulePage() {
  return <Suspense fallback={<div className="p-6 text-center text-xl">Loading...</div>}><ScheduleContent /></Suspense>;
}
