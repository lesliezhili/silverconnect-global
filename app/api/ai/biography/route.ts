import { NextRequest, NextResponse } from "next/server";
import { GeneratePsychologicalBiographySession } from "@/lib/services/ai-service";

export async function POST(req: NextRequest) {
  try {
    const { customerId, audioTranscript } = await req.json();

    // Validate input
    if (!customerId || !audioTranscript) {
      return NextResponse.json(
        { error: "customerId and audioTranscript are required" },
        { status: 400 },
      );
    }

    // Execute biography generation
    const result = await GeneratePsychologicalBiographySession({
      customerId,
      audioTranscript,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: result.error?.includes("quota") ? 403 : 400 },
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
    console.error("POST /api/ai/biography error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
