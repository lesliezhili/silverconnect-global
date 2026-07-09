import { NextResponse } from "next/server";

/**
 * POST /api/admin/seed-admin — Create admin test account
 */
export async function POST() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });

  try {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("Admin1234!", 10);
    const adminId = "a0000000-0000-0000-0000-000000000001";

    // Upsert admin user — isAdmin is orthogonal to role (customer/provider);
    // it grants /admin/* access regardless of which role the user operates as.
    await sql`
      INSERT INTO users (id, email, name, phone, password_hash, role, is_admin, email_verified_at)
      VALUES (${adminId}, 'admin.test@silverconnect.app', 'Platform Admin', '+61400000001', ${passwordHash}, 'customer', true, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        is_admin = true
    `;

    await sql.end();

    return NextResponse.json({
      success: true,
      account: {
        email: "admin.test@silverconnect.app",
        password: "Admin1234!",
        name: "Platform Admin",
        isAdmin: true,
        userId: adminId,
      },
      adminPages: {
        volunteers: "/en/admin/volunteers",
        analytics: "/en/admin/analytics-dashboard",
        prayerAnalytics: "/en/admin/prayer-analytics",
        volunteerManagement: "/en/admin/volunteer-management",
      },
      adminApis: {
        paymentProvider: "GET /api/admin/payment-provider",
        testE2EBoth: "POST /api/admin/test-e2e-both",
        testE2EFull: "POST /api/admin/test-e2e-full",
        testPhledger: "POST /api/admin/test-phledger",
        seedFaith: "POST /api/admin/seed-faith",
        seedChargedProvider: "POST /api/admin/seed-charged-provider",
        seedAllServices: "POST /api/admin/seed-all-services",
        verifyDocument: "POST /api/admin/verify-document",
        approveFaithVolunteer: "POST /api/admin/approve-faith-volunteer",
      },
    });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
