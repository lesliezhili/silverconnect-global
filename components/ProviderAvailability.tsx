// filepath: components/ProviderAvailability.tsx
"use client";

import { useState, useEffect } from "react";

interface AvailabilitySlot {
  day: string;
  start: string;
  end: string;
  available: boolean;
}

interface ProviderAvailabilityProps {
  providerId?: string;
  editable?: boolean;
  onSave?: (availability: AvailabilitySlot[]) => void;
}

const DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

export default function ProviderAvailability({ 
  providerId, 
  editable = true,
  onSave 
}: ProviderAvailabilityProps) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    DAYS.map((day) => ({
      day: day.key,
      start: "09:00",
      end: "17:00",
      available: day.key !== "Sun",
    }))
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (providerId) {
      loadAvailability();
    }
  }, [providerId]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/provider?availability=true&provider_id=${providerId}`);
      const data = await response.json();
      if (data.availability && data.availability.length > 0) {
        const mapped = DAYS.map((day) => {
          const slot = data.availability.find(
            (a: any) => a.day_of_week === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day.key)
          );
          return slot
            ? {
                day: day.key,
                start: slot.start_time?.substring(0, 5) || "09:00",
                end: slot.end_time?.substring(0, 5) || "17:00",
                available: slot.is_available,
              }
            : { day: day.key, start: "09:00", end: "17:00", available: false };
        });
        setAvailability(mapped);
      }
    } catch (error) {
      console.error("Failed to load availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (dayKey: string, field: keyof AvailabilitySlot, value: string | boolean) => {
    setAvailability((prev) =>
      prev.map((slot) =>
        slot.day === dayKey ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/provider", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });

      if (!response.ok) {
        throw new Error("Failed to save availability");
      }

      if (onSave) {
        onSave(availability);
      }
    } catch (error) {
      console.error("Failed to save availability:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Availability Schedule</h3>
      
      <div className="space-y-3">
        {DAYS.map((day) => {
          const slot = availability.find((s) => s.day === day.key);
          if (!slot) return null;

          return (
            <div
              key={day.key}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                slot.available ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="w-24">
                <span className="font-medium text-gray-700">{day.label}</span>
              </div>

              {editable ? (
                <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={slot.available}
                      onChange={(e) => handleSlotChange(day.key, "available", e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-600">Available</span>
                  </label>

                  {slot.available && (
                    <div className="flex items-center gap-2">
                      <select
                        value={slot.start}
                        onChange={(e) => handleSlotChange(day.key, "start", e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-500">to</span>
                      <select
                        value={slot.end}
                        onChange={(e) => handleSlotChange(day.key, "end", e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1">
                  {slot.available ? (
                    <span className="text-green-700">
                      {slot.start} - {slot.end}
                    </span>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editable && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      )}
    </div>
  );
}