import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: { elderId: string } }) {
  const { elderId } = params;
  return NextResponse.json({
    elderId,
    name: "Elder User",
    status: "safe",
    activity: { steps: 3200, avgSteps: 5000, activeMinutes: 25, lastMovement: "10 min ago" },
    vitals: { heartRate: 72, hrStatus: "normal", sleepHours: 7.5, sleepQuality: "good" },
    safety: { fallsToday: 0, deviceStatus: "connected", deviceBattery: 85, location: "Home" },
    medications: [
      { name: "Blood Pressure", time: "08:00", taken: true },
      { name: "Vitamin D", time: "12:00", taken: false },
    ],
    nextService: { service: "Cleaning", date: "Tomorrow", time: "10:00", carerName: "Sarah" },
  });
}
