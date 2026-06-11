import { NextResponse } from "next/server";

/**
 * POST /api/admin/seed-invoices-table — Create invoices table
 */
export async function POST() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    await sql`DROP TYPE IF EXISTS invoice_status CASCADE`;
    await sql`CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded')`;

    await sql`DROP TABLE IF EXISTS invoice_items CASCADE`;
    await sql`DROP TABLE IF EXISTS invoices CASCADE`;

    await sql`CREATE TABLE invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_number TEXT NOT NULL UNIQUE,
      booking_id UUID REFERENCES bookings(id),
      provider_id UUID NOT NULL,
      customer_id UUID NOT NULL,
      status invoice_status DEFAULT 'draft',
      issue_date DATE DEFAULT CURRENT_DATE,
      due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
      subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'AUD',
      notes TEXT,
      payment_provider TEXT,
      payment_reference TEXT,
      xero_invoice_id TEXT,
      phledger_invoice_id TEXT,
      sent_at TIMESTAMPTZ,
      viewed_at TIMESTAMPTZ,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE invoice_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity NUMERIC(10,2) DEFAULT 1,
      unit_price NUMERIC(10,2) NOT NULL,
      tax_rate NUMERIC(5,2) DEFAULT 10,
      amount NUMERIC(10,2) NOT NULL,
      sort_order INT DEFAULT 0
    )`;

    await sql.end();
    return NextResponse.json({ success: true, tables: ["invoices", "invoice_items"], enums: ["invoice_status"] });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
