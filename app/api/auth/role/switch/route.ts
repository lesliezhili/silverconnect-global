import { NextRequest, NextResponse } from "next/server";
import { SwitchUserRole } from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, targetRole } = await req.json();

    // Validate input
    if (!userId || !targetRole) {
      return NextResponse.json(
        { error: "userId and targetRole are required" },
        { status: 400 },
      );
    }

    if (!["customer", "provider", "admin"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Invalid target role" },
        { status: 400 },
      );
    }

    // Execute role switch
    const result = await SwitchUserRole({ userId, targetRole });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: result.error === "Invalid user ID" ? 404 : 400 },
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        currentRole: result.currentRole,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/auth/role/switch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
