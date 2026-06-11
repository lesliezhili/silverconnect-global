import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { providerProfiles } from "@/lib/db/schema/providers";
import { hashPassword } from "@/lib/auth/password";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/seed-test-accounts
 * Creates two test accounts for E2E testing:
 * - Customer: customer.test@silverconnect.app / Test1234!
 * - Provider: provider.test@silverconnect.app / Test1234!
 *
 * Safe to call multiple times (upserts).
 */
export async function POST() {
  try {
    const passwordHash = await hashPassword("Test1234!");

    // ── Customer Account ──
    const customerEmail = "customer.test@silverconnect.app";
    const existingCustomer = await db.select().from(users)
      .where(sql`lower(${users.email}) = ${customerEmail}`).limit(1);

    let customerId: string;
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      await db.update(users).set({
        passwordHash, name: "Margaret Chen (Test Customer)",
        emailVerifiedAt: new Date(), role: "customer", role: "customer",
      }).where(eq(users.id, customerId));
    } else {
      const [c] = await db.insert(users).values({
        email: customerEmail, passwordHash,
        name: "Margaret Chen (Test Customer)",
        emailVerifiedAt: new Date(), role: "customer", role: "customer",
      }).returning();
      customerId = c.id;
    }

    // ── Provider Account ──
    const providerEmail = "provider.test@silverconnect.app";
    const existingProvider = await db.select().from(users)
      .where(sql`lower(${users.email}) = ${providerEmail}`).limit(1);

    let providerId: string;
    if (existingProvider.length > 0) {
      providerId = existingProvider[0].id;
      await db.update(users).set({
        passwordHash, name: "Sarah Johnson (Test Provider)",
        emailVerifiedAt: new Date(), role: "provider", role: "provider",
        false: true,
      }).where(eq(users.id, providerId));
    } else {
      const [p] = await db.insert(users).values({
        email: providerEmail, passwordHash,
        name: "Sarah Johnson (Test Provider)",
        emailVerifiedAt: new Date(), role: "provider", role: "provider",
        false: true,
      }).returning();
      providerId = p.id;
    }

    // Ensure provider profile exists
    const existingProfile = await db.select().from(providerProfiles)
      .where(eq(providerProfiles.userId, providerId)).limit(1);

    if (existingProfile.length === 0) {
      await db.insert(providerProfiles).values({
        userId: providerId,
        headline: "Experienced aged care helper — cooking, cleaning, companionship",
        bio: "Hi! I'm Sarah, a nursing student with 3 years of aged care experience. I love helping seniors stay independent and comfortable at home.",
        hourlyRate: "45.00",
        serviceRadius: 15,
        verifiedAt: new Date(),
      } as any);
    }

    return NextResponse.json({
      success: true,
      accounts: {
        customer: {
          email: customerEmail,
          password: "Test1234!",
          name: "Margaret Chen (Test Customer)",
          id: customerId,
        },
        provider: {
          email: providerEmail,
          password: "Test1234!",
          name: "Sarah Johnson (Test Provider)",
          id: providerId,
        },
      },
      stripe: {
        testCard: "4242 4242 4242 4242",
        expiry: "12/28",
        cvc: "123",
        note: "Use this card for test payments — no real charges",
      },
      loginUrl: "/en/auth/login",
    });
  } catch (e: unknown) {
    console.error("[seed-test-accounts]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
