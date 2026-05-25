import { NextRequest, NextResponse } from "next/server";
import { ProcessAIIncomingInquiry } from "@/lib/services/ai-service";

export async function POST(req: NextRequest) {
  try {
    const { userId, message } = await req.json();

    // Validate input
    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId and message are required" },
        { status: 400 },
      );
    }

    // Execute AI inquiry processing
    const result = await ProcessAIIncomingInquiry({ userId, message });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process inquiry" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        response: result.response,
        intent: result.intent,
        routedToHuman: result.routedToHuman || false,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/ai/inquiry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
