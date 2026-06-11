import { NextRequest, NextResponse } from "next/server";
import { processAIIncomingInquiry } from "@/lib/ai/service";
import { getOptionalAuthSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getOptionalAuthSession();
  const { message, conversationId } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const result = await processAIIncomingInquiry(
    session?.userId ?? null,
    message,
    conversationId,
  );

  return NextResponse.json(result);
}
