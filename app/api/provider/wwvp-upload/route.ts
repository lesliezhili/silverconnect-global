import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { uploadFile } from "@/lib/storage/gateway";

export const dynamic = "force-dynamic";

function getSession() {
  return { password: process.env.SESSION_SECRET || "fallback-session-secret-minimum-32-characters-long", cookieName: "sc-session", cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" as const } };
}

// Maps user-facing types to DB enum values
const TYPE_MAP: Record<string, string> = {
  wwvp: "wwc", wwc: "wwc",
  police_check: "police_check",
  first_aid: "first_aid",
  insurance: "insurance",
  identity: "identity",
};

export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not registered as provider" }, { status: 404 }); }

    const contentType = req.headers.get("content-type") || "";
    let documentType: string, expiryDate: string | null, cardNumber: string | null, fileUrl: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      documentType = (formData.get("documentType") as string) || "wwvp";
      expiryDate = formData.get("expiryDate") as string | null;
      cardNumber = formData.get("cardNumber") as string | null;

      if (!file) { await sql.end(); return NextResponse.json({ error: "No file provided" }, { status: 400 }); }
      if (file.size > 10 * 1024 * 1024) { await sql.end(); return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 }); }

      const ext = file.name.split(".").pop() || "pdf";
      const path = "documents/" + profile.id + "/" + documentType + "_" + Date.now() + "." + ext;
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile({ bucket: "documents", path, buffer, contentType: file.type });
      if (!result.success) { await sql.end(); return NextResponse.json({ error: "Upload failed: " + result.error }, { status: 500 }); }
      fileUrl = result.url!;
    } else {
      const body = await req.json();
      documentType = body.documentType || "wwvp";
      expiryDate = body.expiryDate || null;
      cardNumber = body.cardNumber || null;
      fileUrl = body.fileUrl || "https://storage.silverconnect.app/documents/" + profile.id + "/pending_" + Date.now();
    }

    // Map to DB enum
    const dbType = TYPE_MAP[documentType];
    if (!dbType) { await sql.end(); return NextResponse.json({ error: "Invalid type. Use: wwvp, police_check, first_aid, insurance, identity" }, { status: 400 }); }

    // Upsert document (unique on provider_id + type)
    const [doc] = await sql`INSERT INTO provider_documents (provider_id, type, file_url, document_number, status, expires_at)
      VALUES (${profile.id}, ${dbType}, ${fileUrl}, ${cardNumber}, 'pending', ${expiryDate || null})
      ON CONFLICT (provider_id, type) DO UPDATE SET file_url = EXCLUDED.file_url, document_number = EXCLUDED.document_number,
        expires_at = EXCLUDED.expires_at, status = 'pending', updated_at = NOW()
      RETURNING id, type, status`;

    // Update onboarding to docs_review
    await sql`UPDATE provider_profiles SET onboarding_status = 'docs_review' WHERE id = ${profile.id} AND onboarding_status = 'pending'`;

    // Notify
    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${session.userId}, 'system', 'Document Uploaded', ${dbType.toUpperCase() + ' uploaded. Verification in 1-2 days.'}, '/provider/documents')`;

    await sql.end();
    return NextResponse.json({ success: true, documentId: doc.id, type: doc.type, status: doc.status, fileUrl, message: "Uploaded! Verification in 1-2 business days." });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { getIronSession } = await import("iron-session");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const session = await getIronSession<{ userId?: string }>(cookieStore, getSession());
    if (!session.userId) { await sql.end(); return NextResponse.json({ error: "Not logged in" }, { status: 401 }); }

    const [profile] = await sql`SELECT id FROM provider_profiles WHERE user_id = ${session.userId}`;
    if (!profile) { await sql.end(); return NextResponse.json({ error: "Not registered" }, { status: 404 }); }

    const docs = await sql`SELECT id, type, file_url, document_number, expires_at, status, reviewed_at, reviewer_note, created_at
      FROM provider_documents WHERE provider_id = ${profile.id} ORDER BY created_at DESC`;

    await sql.end();
    return NextResponse.json({
      success: true,
      documents: docs,
      requiredDocuments: [
        { type: "wwc", label: "Working with Vulnerable People (WWC/WWVP)", required: true },
        { type: "police_check", label: "National Police Check", required: true },
        { type: "first_aid", label: "First Aid Certificate", required: false },
      ],
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
