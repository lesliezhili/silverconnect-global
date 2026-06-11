import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { randomUUID } from "crypto";

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(url, key);
      const ext = file.type.includes("png") ? "png" : "jpg";
      const path = bookingId + "/" + type + "_" + randomUUID().slice(0, 8) + "." + ext;
      const buf = Buffer.from(await file.arrayBuffer());
      const { data, error } = await sb.storage.from("evidence").upload(path, buf, { contentType: file.type });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const { data: u } = sb.storage.from("evidence").getPublicUrl(data.path);
      return NextResponse.json({ success: true, url: u.publicUrl, path: data.path });
    }
    const fakeUrl = "https://storage.silverconnect.app/evidence/" + bookingId + "/" + type + "_" + randomUUID().slice(0, 8) + ".jpg";
    return NextResponse.json({ success: true, url: fakeUrl, simulated: true });
  }

  const body = await req.json();
  if (!body.bookingId || !body.type) return NextResponse.json({ error: "bookingId and type required" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
  const path = body.bookingId + "/" + body.type + "_" + randomUUID().slice(0, 8) + "." + (body.fileExt || "jpg");
  const { data, error } = await sb.storage.from("evidence").createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, signedUrl: data.signedUrl, path });
}
