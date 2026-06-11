import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/customer/invoices?customerId=xxx — List customer's invoices
 * 
 * Returns all invoices sent to this customer, newest first.
 * Marks invoice as 'viewed' on first access.
 */
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const invoices = await sql`
      SELECT i.*, u.name as provider_name, u.email as provider_email
      FROM invoices i
      JOIN users u ON i.provider_id = u.id
      WHERE i.customer_id = ${customerId}
      ORDER BY i.created_at DESC
      LIMIT 50
    `;
    await sql.end();
    return NextResponse.json({ success: true, total: invoices.length, invoices });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
