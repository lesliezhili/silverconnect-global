import { NextRequest, NextResponse } from "next/server";
import { getProviderSecurityStatus, submitSecurityDocument } from "@/lib/safety/service";
import { requireUser } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const status = await getProviderSecurityStatus(user.id);
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  const result = await submitSecurityDocument({
    providerId: user.id, checkType: body.checkType,
    documentUrl: body.documentUrl, certificateNumber: body.certificateNumber,
    issuedDate: body.issuedDate, expiryDate: body.expiryDate,
    issuingAuthority: body.issuingAuthority,
  });
  return NextResponse.json(result, { status: 201 });
}
