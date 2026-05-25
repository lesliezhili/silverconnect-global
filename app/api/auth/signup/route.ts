import { NextRequest, NextResponse } from "next/server";
import { SignUp, validateEmail, validatePassword, validateFullName } from "@/lib/services/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, selectedLanguage, country } = await req.json();

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 },
      );
    }

    // Validate full name
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.message },
        { status: 400 },
      );
    }

    // Execute signup
    const result = await SignUp({
      email: email.toLowerCase(),
      password,
      fullName,
      selectedLanguage: selectedLanguage || "en",
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
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
