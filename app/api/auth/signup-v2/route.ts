import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth/actions";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await signUp({
    email: body.email,
    password: body.password,
    name: body.fullName || body.full_name,
    selectedLanguage: body.language || body.selectedLanguage,
    country: body.country,
  });

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 400 });
  }
  return NextResponse.json({ success: true, userId: result.userId }, { status: 201 });
}
