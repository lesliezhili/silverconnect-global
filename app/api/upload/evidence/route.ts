import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/server";
import { randomUUID } from "crypto";
import { uploadFile, createSignedUploadUrl, getPublicUrl } from "@/lib/storage/gateway";
import { db } from "@/lib/db";
import { bookings, bookingEvidence } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";

export const dynamic = "force-dynamic";

/**
 * Before/after quality-control evidence (photo or short video).
 *
 * - multipart/form-data: small photos, uploaded through this route.
 * - JSON { bookingId, type, contentType }: returns a signed URL so the
 *   client uploads videos / large photos straight to storage (they
 *   exceed the serverless request-body limit), then
 * - JSON { action: "record", bookingId, type, path }: saves the
 *   booking_evidence row for that direct upload.
 *
 * Only the provider assigned to the booking may add evidence.
 */

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

async function isAssignedProvider(userId: string, bookingId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(providerProfiles, eq(providerProfiles.id, bookings.providerId))
    .where(and(eq(bookings.id, bookingId), eq(providerProfiles.userId, userId)))
    .limit(1);
  return !!row;
}

/** QC area key (lib/release-quality.ts QC_AREAS), stored in booking_evidence.description. */
function cleanArea(area: unknown): string | null {
  return typeof area === "string" && /^[a-z_]{1,32}$/.test(area) ? area : null;
}

function validPhase(type: unknown): type is "before" | "after" {
  return type === "before" || type === "after";
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    const bookingId = fd.get("bookingId") as string;
    const type = fd.get("type") as string;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!bookingId || !type) return NextResponse.json({ error: "bookingId and type required" }, { status: 400 });
    if (!validPhase(type)) return NextResponse.json({ error: "type must be 'before' or 'after'" }, { status: 400 });
    const ext = EXT_BY_TYPE[file.type];
    if (!ext || !file.type.startsWith("image/")) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Max 10MB" }, { status: 400 });
    if (!(await isAssignedProvider(user.id, bookingId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const path = bookingId + "/" + type + "_" + randomUUID().slice(0, 8) + "." + ext;
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile({ bucket: "evidence", path, buffer: buf, contentType: file.type });
    if (!result.success) return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });

    const [row] = await db
      .insert(bookingEvidence)
      .values({ bookingId, uploadedBy: user.id, phase: type, fileUrl: result.url!, description: cleanArea(fd.get("area")) })
      .returning({ id: bookingEvidence.id });

    return NextResponse.json({ success: true, id: row.id, url: result.url, path: result.path, simulated: result.simulated });
  }

  const body = await req.json();
  const { bookingId, type } = body;
  if (!bookingId || !type) return NextResponse.json({ error: "bookingId and type required" }, { status: 400 });
  if (!validPhase(type)) return NextResponse.json({ error: "type must be 'before' or 'after'" }, { status: 400 });
  if (!(await isAssignedProvider(user.id, bookingId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.action === "record") {
    const path = String(body.path || "");
    // Only accept paths this route signed for this booking + phase.
    if (!path.startsWith(`${bookingId}/${type}_`) || path.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const fileUrl = getPublicUrl("evidence", path);
    const [row] = await db
      .insert(bookingEvidence)
      .values({ bookingId, uploadedBy: user.id, phase: type, fileUrl, description: cleanArea(body.area) })
      .returning({ id: bookingEvidence.id });
    return NextResponse.json({ success: true, id: row.id, url: fileUrl, path });
  }

  const contentType = String(body.contentType || "");
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  const size = Number(body.size || 0);
  const max = contentType.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  if (size > max) return NextResponse.json({ error: contentType.startsWith("video/") ? "Max 100MB" : "Max 10MB" }, { status: 400 });

  const path = bookingId + "/" + type + "_" + randomUUID().slice(0, 8) + "." + ext;
  const result = await createSignedUploadUrl({ bucket: "evidence", path, contentType });
  if (!result.success) return NextResponse.json({ error: result.error || "Storage not configured" }, { status: 503 });
  return NextResponse.json({ success: true, signedUrl: result.signedUrl, path: result.path });
}
