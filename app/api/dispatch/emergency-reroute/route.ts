import { NextRequest, NextResponse } from "next/server";
import { TriggerAutomatedEmergencyReroute } from "@/lib/services/dispatch";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, originalProviderId, customerId, customerPostcode } = await req.json();

    // Validate input
    if (!bookingId || !originalProviderId || !customerId || !customerPostcode) {
      return NextResponse.json(
        { error: "bookingId, originalProviderId, customerId, and customerPostcode are required" },
        { status: 400 },
      );
    }

    // Execute emergency reroute
    const result = await TriggerAutomatedEmergencyReroute({
      bookingId,
      originalProviderId,
      customerId,
      customerPostcode,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        data: result.data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/dispatch/emergency-reroute error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
