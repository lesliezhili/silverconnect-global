import { NextRequest, NextResponse } from "next/server";
import { ExecuteAIPeriodicCheckIn } from "@/lib/services/dispatch";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, providerId, hoursRemaining } = await req.json();

    // Validate input
    if (!bookingId || !providerId || hoursRemaining === undefined) {
      return NextResponse.json(
        { error: "bookingId, providerId, and hoursRemaining are required" },
        { status: 400 },
      );
    }

    // Execute periodic check-in
    const result = await ExecuteAIPeriodicCheckIn({
      bookingId,
      providerId,
      hoursRemaining,
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
        confirmationStatus: result.confirmationStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/dispatch/check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
