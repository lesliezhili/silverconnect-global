import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { govtFundingGrants } from "@/lib/db/schema/govtFunding";

/**
 * Government-funded program features (NDIS, TAC, WorkSafe, DVA, My Aged
 * Care, Aged Pension/CHSP, Super) are limited to accounts the platform
 * owner has explicitly granted access to, via the admin-managed
 * `govt_funding_grants` table (app/[locale]/(admin)/admin/govt-funding-access/page.tsx).
 * Everyone else sees the self-funded / private-pay experience only.
 *
 * This is deliberately conservative: SilverConnect itself has not yet
 * completed its own NDIS Commission "digital platform" registration
 * (required from 1 July 2026), so real NDIS-funded activity stays limited
 * to hand-vetted accounts until that's sorted out.
 */
export async function hasGovtFundingAccess(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const [grant] = await db
    .select({ id: govtFundingGrants.id })
    .from(govtFundingGrants)
    .where(and(eq(govtFundingGrants.email, email.toLowerCase()), eq(govtFundingGrants.status, "active")))
    .limit(1);
  return !!grant;
}
