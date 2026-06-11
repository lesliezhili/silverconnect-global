import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/seed-charged-provider
 * Creates a second test provider for PAID services (cleaning, garden, repair, etc.)
 */
export async function POST(req: NextRequest) {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  try {
    const email = "charged.provider@silverconnect.app";
    const password = "Test1234!";

    // Check if already exists
    const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing) {
      await sql.end();
      return NextResponse.json({ success: true, message: "Charged provider already exists", userId: existing.id, email, password });
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, name, phone, is_provider_onboarded, current_active_role, password_hash)
      VALUES (${email}, 'James Wilson', '+61412345999', true, 'provider', ${hash})
      RETURNING id`;

    // Create provider profile (PAID provider — has ABN + bank)
    const [pp] = await sql`
      INSERT INTO provider_profiles (user_id, bio, address_line, service_radius_km, bsb, account_number, account_name, onboarding_status, submitted_at, approved_at, notes)
      VALUES (
        ${user.id},
        'Professional home services provider. 5+ years experience in cleaning, gardening, and repairs. Fully insured.',
        '42 Collins St, Melbourne VIC 3000',
        15,
        '063-000',
        '12345678',
        'James Wilson',
        'approved',
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '28 days',
        '{"type": "charged_provider", "abn": "12345678901", "insurance": "CGU-PRO-2026-1234", "specialties": ["cleaning", "garden", "repair", "personalCare"]}'
      )
      RETURNING id`;

    // Create wallet
    await sql`INSERT INTO wallets (provider_id, balance_available, balance_pending, currency)
      VALUES (${pp.id}, 0, 0, 'AUD')
      ON CONFLICT DO NOTHING`;

    // Create documents (all approved)
    const docs = [
      { type: 'police_check', number: 'VPC-2026-8888', status: 'approved' },
      { type: 'first_aid', number: 'FA-HLTAID011-2026', status: 'approved' },
      { type: 'insurance', number: 'CGU-PRO-2026-1234', status: 'approved' },
      { type: 'identity', number: 'DL-VIC-999888', status: 'approved' },
      { type: 'wwc', number: 'WWC-VIC-2026-5555', status: 'approved' },
    ];
    for (const doc of docs) {
      await sql`INSERT INTO provider_documents (provider_id, type, document_number, status, file_url, expires_at, reviewed_at)
        VALUES (${pp.id}, ${doc.type}, ${doc.number}, ${doc.status}, '/uploads/placeholder.pdf', NOW() + INTERVAL '2 years', NOW())
        ON CONFLICT (provider_id, type) DO NOTHING`;
    }

    await sql.end();
    return NextResponse.json({
      success: true,
      message: "Charged service provider created",
      userId: user.id,
      providerId: pp.id,
      email,
      password,
      name: "James Wilson",
      services: ["cleaning", "garden", "repair", "personalCare"],
      hourlyRate: "$45/hr",
      documents: docs.map(d => `${d.type}: ${d.status}`),
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
