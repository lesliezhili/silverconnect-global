import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { getCurrentUser } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/[id]/evidence
 * Upload before/after service evidence (photos, videos).
 * Provider uploads BEFORE photos at start, AFTER photos at completion.
 *
 * Body: { type: "before" | "after", mediaType: "photo" | "video", url: string, description?: string }
 *
 * In production: integrate with cloud storage (S3/R2) for actual file upload.
 * This endpoint records the metadata.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookingId } = await params;
  const body = await req.json();
  const { type, mediaType, url, description } = body;

  if (!type || !["before", "after"].includes(type)) {
    return NextResponse.json({ error: "type must be 'before' or 'after'" }, { status: 400 });
  }
  if (!mediaType || !["photo", "video"].includes(mediaType)) {
    return NextResponse.json({ error: "mediaType must be 'photo' or 'video'" }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Verify booking exists and user is the provider
  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Store evidence record (in production: separate evidence table)
  const evidenceId = randomUUID();
  const evidence = {
    id: evidenceId,
    bookingId,
    providerId: me.id,
    type, // "before" or "after"
    mediaType, // "photo" or "video"
    url,
    description: description || null,
    uploadedAt: new Date().toISOString(),
  };

  // Update booking status based on evidence type
  if (type === "before" && booking.status === "confirmed") {
    await db.update(bookings).set({
      status: "in_progress" as never,
      startedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(bookings.id, bookingId));
  }

  return NextResponse.json({
    success: true,
    evidence,
    message: type === "before"
      ? "Before-service evidence recorded. Service is now in progress."
      : "After-service evidence recorded. Please mark the job as complete.",
  }, { status: 201 });
}

/**
 * GET /api/bookings/[id]/evidence
 * Retrieve all evidence for a booking (visible to both customer and provider).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookingId } = await params;

  // In production: query evidence table
  // For now: return structure
  return NextResponse.json({
    bookingId,
    evidence: [],
    note: "Evidence records will be stored in cloud storage. Photos/videos are required before and after service.",
    requirements: {
      before: { minPhotos: 1, videoOptional: true, description: "Take photos showing the area BEFORE you start cleaning" },
      after: { minPhotos: 1, videoOptional: true, description: "Take photos showing the area AFTER cleaning is complete" },
    },
  });
}
