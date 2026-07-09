import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const { documentId, action, reason } = await req.json();
    if (!documentId || !action) return NextResponse.json({ error: "documentId and action required" }, { status: 400 });
    if (!["verify", "reject"].includes(action)) return NextResponse.json({ error: "action must be verify or reject" }, { status: 400 });

    const [doc] = await sql`SELECT id, provider_id, type FROM provider_documents WHERE id = ${documentId}`;
    if (!doc) { await sql.end(); return NextResponse.json({ error: "Document not found" }, { status: 404 }); }

    const newStatus = action === "verify" ? "approved" : "rejected";
    await sql`UPDATE provider_documents SET status = ${newStatus}, reviewed_at = NOW(), reviewer_note = ${reason || null}, updated_at = NOW() WHERE id = ${documentId}`;

    // Notify provider
    const [profile] = await sql`SELECT user_id FROM provider_profiles WHERE id = ${doc.provider_id}`;
    if (profile) {
      const title = action === "verify" ? "Document Verified \u2713" : "Document Issue";
      const body = action === "verify"
        ? "Your " + doc.type + " has been verified. Thank you!"
        : "Your " + doc.type + " needs attention: " + (reason || "Please re-upload.");
      await sql`INSERT INTO notifications (user_id, kind, title, body, link) VALUES (${profile.user_id}, 'system', ${title}, ${body}, '/provider/documents')`;
    }

    // Auto-approve if WWC + police_check both approved
    if (action === "verify") {
      const allDocs = await sql`SELECT type, status FROM provider_documents WHERE provider_id = ${doc.provider_id}`;
      const approved = allDocs.filter((d: { status: string }) => d.status === "approved");
      const hasWWC = approved.some((d: { type: string }) => d.type === "wwc");
      const hasPolice = approved.some((d: { type: string }) => d.type === "police_check");
      if (hasWWC && hasPolice) {
        await sql`UPDATE provider_profiles SET onboarding_status = 'approved', approved_at = NOW() WHERE id = ${doc.provider_id}`;
        if (profile) {
          await sql`INSERT INTO notifications (user_id, kind, title, body, link)
            VALUES (${profile.user_id}, 'system', 'Approved! \ud83c\udf89', 'All documents verified. You can now accept bookings!', '/provider')`;
        }
      }
    }

    await sql.end();
    return NextResponse.json({ success: true, action, documentId, newStatus });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const docs = await sql`
      SELECT pd.id, pd.type, pd.file_url, pd.document_number, pd.expires_at, pd.status,
             pd.created_at, pd.reviewed_at, pd.reviewer_note,
             pp.user_id, u.name, u.email
      FROM provider_documents pd
      JOIN provider_profiles pp ON pp.id = pd.provider_id
      JOIN users u ON u.id = pp.user_id
      ORDER BY pd.created_at DESC`;

    await sql.end();
    return NextResponse.json({
      success: true,
      total: docs.length,
      pendingReview: docs.filter((d: { status: string }) => d.status === "pending").length,
      documents: docs,
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
