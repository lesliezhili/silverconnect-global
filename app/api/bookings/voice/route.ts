import { NextRequest, NextResponse } from "next/server";
import { parseVoiceIntent, generateConfirmation } from "@/lib/ai/voice-booking-agent";

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();
  if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });
  const intent = parseVoiceIntent(transcript);
  const confirmation = generateConfirmation(intent);
  return NextResponse.json({ intent, confirmation, message: intent.confidence > 0.5 ? "Booking ready to confirm" : "Could you provide more details?" });
}
