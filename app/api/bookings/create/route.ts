import { NextRequest, NextResponse } from "next/server";
import { CreateBookingRequest } from "@/lib/services/bookings";

export async function POST(req: NextRequest) {
  try {
    const {
      customerId,
      serviceType,
      targetDateTime,
      durationHours,
      customerPostcode,
    } = await req.json();

    // Validate input
    if (!customerId || !serviceType || !targetDateTime || !durationHours) {
      return NextResponse.json(
        { error: "customerId, serviceType, targetDateTime, and durationHours are required" },
        { status: 400 },
      );
    }

    // Convert targetDateTime string to Date
    const bookingDate = new Date(targetDateTime);
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid targetDateTime format" },
        { status: 400 },
      );
    }

    // Execute booking creation
    const result = await CreateBookingRequest({
      customerId,
      serviceType,
      targetDateTime: bookingDate,
      durationHours: parseFloat(durationHours),
      customerPostcode: customerPostcode || "",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: result.error?.includes("No matching") ? 404 : 400 },
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        data: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/bookings/create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
