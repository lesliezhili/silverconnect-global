import { NextRequest, NextResponse } from "next/server";
import { generateBiographySession, getBiographyProgress } from "@/lib/ai/service";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const { transcript, sessionTitle } = await req.json();

  if (!transcript) {
    return NextResponse.json({ error: "Transcript required" }, { status: 400 });
  }

  const result = await generateBiographySession({
    customerId: user.id,
    transcript,
    sessionTitle,
  });

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 403 });
  }
  return NextResponse.json(result, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const progress = await getBiographyProgress(user.id);
  return NextResponse.json(progress);
}
