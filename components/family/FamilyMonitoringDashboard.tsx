"use client";

import { useEffect, useState } from "react";

/**
 * Family Monitoring Dashboard
 * Target: Adult children / family carers (35-55 age, normal font sizes)
 * 8 card-based sections with traffic-light status system
 * Auto-refresh every 60 seconds
 */

type OverallStatus = "safe" | "attention" | "alert";

interface ElderStatus {
  elderId: string;
  name: string;
  status: OverallStatus;
  activity: { steps: number; avgSteps: number; activeMinutes: number; lastMovement: string };
  vitals: { heartRate: number; hrStatus: string; sleepHours: number; sleepQuality: string };
  safety: { fallsToday: number; deviceStatus: string; deviceBattery: number; location: string };
  medications: { name: string; time: string; taken: boolean }[];
  nextService?: { service: string; date: string; time: string; carerName: string };
}

export default function FamilyMonitoringDashboard({ elderId }: { elderId: string }) {
  const [data, setData] = useState<ElderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Auto-refresh 60s
    return () => clearInterval(interval);
  }, [elderId]);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/family/status/${elderId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to fetch elder status:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (!data) return <div className="p-6 text-center text-red-500">Unable to load status</div>;

  const statusColors = {
    safe: "border-green-400 bg-green-50",
    attention: "border-amber-400 bg-amber-50",
    alert: "border-red-400 bg-red-50",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header with traffic-light status */}
      <header className={`mb-4 rounded-xl border-2 p-4 ${statusColors[data.status]}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold capitalize">{data.status}</span>
            </p>
          </div>
          <StatusDot status={data.status} />
        </div>
      </header>

      {/* Alert Banner (only when status = alert) */}
      {data.status === "alert" && (
        <div className="mb-4 rounded-xl bg-red-600 p-4 text-white shadow-lg">
          <p className="font-bold">⚠️ Attention Required</p>
          <p className="text-sm">
            {data.safety.fallsToday > 0 && `Fall detected today. `}
            {data.safety.deviceStatus === "offline" && `Device is offline. `}
          </p>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Activity Card */}
        <Card title="📊 Activity">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Steps</span>
              <span className="font-semibold">{data.activity.steps.toLocaleString()}</span>
            </div>
            <ProgressBar value={data.activity.steps} max={data.activity.avgSteps} />
            <p className="text-sm text-gray-500">{Math.round(data.activity.steps / data.activity.avgSteps * 100)}% of daily average</p>
            <div className="flex justify-between">
              <span>Active Minutes</span>
              <span className="font-semibold">{data.activity.activeMinutes} min</span>
            </div>
            <p className="text-sm text-gray-500">Last movement: {data.activity.lastMovement}</p>
          </div>
        </Card>

        {/* Vitals Card */}
        <Card title="❤️ Vitals">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Heart Rate</span>
              <span className={`font-semibold ${data.vitals.hrStatus === "normal" ? "text-green-600" : "text-amber-600"}`}>
                {data.vitals.heartRate} bpm ({data.vitals.hrStatus})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sleep</span>
              <span className="font-semibold">{data.vitals.sleepHours}h ({data.vitals.sleepQuality})</span>
            </div>
          </div>
        </Card>

        {/* Safety Card */}
        <Card title="🛡️ Safety">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Falls Today</span>
              <span className={`font-semibold ${data.safety.fallsToday > 0 ? "text-red-600" : "text-green-600"}`}>
                {data.safety.fallsToday}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Device</span>
              <span className="font-semibold">{data.safety.deviceStatus} ({data.safety.deviceBattery}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Location</span>
              <span className="font-semibold">{data.safety.location}</span>
            </div>
          </div>
        </Card>

        {/* Medications Card */}
        <Card title="💊 Medications">
          <div className="space-y-2">
            {data.medications.map((med, i) => (
              <div key={i} className="flex items-center justify-between">
                <span>{med.name} ({med.time})</span>
                <span>{med.taken ? "✅" : "⏳"}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Next Service Card */}
        {data.nextService && (
          <Card title="📅 Next Service">
            <div className="space-y-1">
              <p className="font-semibold">{data.nextService.service}</p>
              <p className="text-sm text-gray-600">{data.nextService.date} at {data.nextService.time}</p>
              <p className="text-sm text-gray-600">Carer: {data.nextService.carerName}</p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card title="⚡ Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon="📞" label="Call" />
            <ActionBtn icon="💬" label="Message" />
            <ActionBtn icon="📍" label="Location" />
            <ActionBtn icon="📋" label="History" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: OverallStatus }) {
  const colors = { safe: "bg-green-500", attention: "bg-amber-500", alert: "bg-red-500" };
  return <div className={`h-4 w-4 rounded-full ${colors[status]} animate-pulse`} />;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-gray-200">
      <div className="h-2 rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ActionBtn({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 text-center hover:bg-gray-50">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
