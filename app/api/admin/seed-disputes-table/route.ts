import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * POST /api/admin/seed-disputes-table — Create disputes + cancellation tables.
 * DESTRUCTIVE: drops and recreates disputes/dispute_messages/cancellations —
 * never call against an environment with real dispute data.
 */
export async function POST() {
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    // Create dispute_status enum
    await sql`DROP TYPE IF EXISTS dispute_status CASCADE`;
    await sql`CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_refund_full', 'resolved_refund_partial', 'resolved_rejected', 'escalated', 'closed')`;

    // Create cancellation_reason enum
    await sql`DROP TYPE IF EXISTS cancellation_reason CASCADE`;
    await sql`CREATE TYPE cancellation_reason AS ENUM ('customer_request', 'provider_unavailable', 'emergency', 'duplicate', 'policy_violation', 'other')`;

    // Drop + recreate disputes table
    await sql`DROP TABLE IF EXISTS dispute_messages CASCADE`;
    await sql`DROP TABLE IF EXISTS disputes CASCADE`;
    await sql`CREATE TABLE disputes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id),
      raised_by UUID NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      description TEXT,
      evidence_urls TEXT[] DEFAULT '{}',
      status dispute_status DEFAULT 'open',
      resolution TEXT,
      refund_amount NUMERIC(10,2) DEFAULT 0,
      refund_type TEXT DEFAULT 'none',
      resolved_by UUID REFERENCES users(id),
      resolved_at TIMESTAMPTZ,
      payment_provider TEXT,
      refund_transaction_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Drop + recreate cancellations table
    await sql`DROP TABLE IF EXISTS cancellations CASCADE`;
    await sql`CREATE TABLE cancellations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id),
      cancelled_by UUID NOT NULL REFERENCES users(id),
      reason cancellation_reason DEFAULT 'customer_request',
      notes TEXT,
      refund_amount NUMERIC(10,2) DEFAULT 0,
      cancellation_fee NUMERIC(10,2) DEFAULT 0,
      refund_status TEXT DEFAULT 'pending',
      refund_transaction_id TEXT,
      payment_provider TEXT,
      policy_applied TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // Create dispute_messages table
    await sql`CREATE TABLE IF NOT EXISTS dispute_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dispute_id UUID NOT NULL REFERENCES disputes(id),
      sender_id UUID NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT false,
      attachment_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql.end();

    return NextResponse.json({
      success: true,
      tables: ["disputes", "cancellations", "dispute_messages"],
      enums: ["dispute_status", "cancellation_reason"],
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
