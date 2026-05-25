import { NextRequest, NextResponse } from "next/server";
import { OnboardProvider } from "@/lib/services/providers";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      serviceTypes,
      baseRate,
      servicePostcodes,
      abn,
      country,
    } = await req.json();

    // Validate input
    if (!userId || !serviceTypes || !baseRate) {
      return NextResponse.json(
        { error: "userId, serviceTypes, and baseRate are required" },
        { status: 400 },
      );
    }

    // Execute provider onboarding
    const result = await OnboardProvider({
      userId,
      serviceTypes,
      baseRate,
      servicePostcodes: servicePostcodes || [],
      abn,
      country: country || "AU",
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
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/providers/onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
