import { NextRequest, NextResponse } from "next/server";
import { OnboardCustomer, LinkRepresentative } from "@/lib/services/customers";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      flatAddress,
      coordinates,
      emergencyContact,
      languagePreference,
    } = await req.json();

    // Validate input
    if (!userId || !flatAddress || !coordinates || !emergencyContact) {
      return NextResponse.json(
        { error: "userId, flatAddress, coordinates, and emergencyContact are required" },
        { status: 400 },
      );
    }

    // Execute customer onboarding
    const result = await OnboardCustomer({
      userId,
      flatAddress,
      coordinates,
      emergencyContact,
      languagePreference: languagePreference || "en",
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
    console.error("POST /api/customers/onboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
