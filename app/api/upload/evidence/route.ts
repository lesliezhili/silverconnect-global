import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { randomUUID } from "crypto";
import { uploadFile, createSignedUploadUrl } from "@/lib/storage/gateway";

export const dynamic = "force-dynamic";

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
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max 10MB" }, { status: 400 });

    const ext = file.type.includes("png") ? "png" : "jpg";
    const path = bookingId + "/" + type + "_" + randomUUID().slice(0, 8) + "." + ext;
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile({ bucket: "evidence", path, buffer: buf, contentType: file.type });
    if (!result.success) return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 });
    return NextResponse.json({ success: true, url: result.url, path: result.path, simulated: result.simulated });
  }

  const body = await req.json();
  if (!body.bookingId || !body.type) return NextResponse.json({ error: "bookingId and type required" }, { status: 400 });
  const path = body.bookingId + "/" + body.type + "_" + randomUUID().slice(0, 8) + "." + (body.fileExt || "jpg");
  const result = await createSignedUploadUrl({ bucket: "evidence", path });
  if (!result.success) return NextResponse.json({ error: result.error || "Storage not configured" }, { status: 503 });
  return NextResponse.json({ success: true, signedUrl: result.signedUrl, path: result.path });
}
