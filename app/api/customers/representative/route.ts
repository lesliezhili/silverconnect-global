import { NextRequest, NextResponse } from "next/server";
import { linkRepresentative, revokeRepresentative } from "@/lib/customers/actions";
import { requireUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const { representativeUserId, authorizationDocUrl } = await req.json();
  // linkRepresentative takes LinkRepresentativeInput object
  const result = await linkRepresentative({
    elderUserId: user.id,
    representativeUserId,
    authorizationDocUrl,
  });

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 422 });
  }
  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  const { representativeUserId } = await req.json();
  // revokeRepresentative takes 2 positional string args
  const result = await revokeRepresentative(user.id, representativeUserId);

  if (!result.success) {
    return NextResponse.json({ error: (result as any).error }, { status: 400 });
  }
  return NextResponse.json(result);
}
