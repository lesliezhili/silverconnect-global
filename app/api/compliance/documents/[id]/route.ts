import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerDocuments, providerProfiles } from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { readPrivateUpload } from "@/lib/upload/private";

/**
 * Authenticated download for a compliance document. Only an admin or the
 * provider who owns the document may read it. Files live in private storage
 * (see lib/upload/private.ts); legacy rows that still hold a public
 * /uploads/... URL are redirected until the migrate script moves them.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });

  const [doc] = await db
    .select({
      fileUrl: providerDocuments.fileUrl,
      providerUserId: providerProfiles.userId,
    })
    .from(providerDocuments)
    .leftJoin(
      providerProfiles,
      eq(providerProfiles.id, providerDocuments.providerId),
    )
    .where(eq(providerDocuments.id, id))
    .limit(1);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const isOwner = doc.providerUserId === me.id;
  if (me.role !== "admin" && !isOwner) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (doc.fileUrl.startsWith("/")) {
    return NextResponse.redirect(new URL(doc.fileUrl, req.url));
  }

  const file = await readPrivateUpload(doc.fileUrl);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
