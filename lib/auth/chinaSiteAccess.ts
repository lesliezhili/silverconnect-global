/**
 * The "CN" country option (China pricing/currency display) is still
 * running on the AU-hosted Vercel/Supabase/Stripe stack, which doesn't
 * actually work for real mainland China users (Vercel/Supabase are
 * unreachable behind the GFW, Stripe isn't usable there). Until the
 * real mainland deployment (see docs/CHINA_DEPLOYMENT.md) is live,
 * "CN" is hidden from the public country switcher and limited to this
 * small internal allowlist for preview/testing.
 */
const CHINA_SITE_ALLOWLIST = new Set([
  "zhili@phledger.com",
  "lesliezhi.li@gmail.com",
  "lee_5210@hotmail.com",
]);

export function hasChinaSiteAccess(email: string | null | undefined): boolean {
  return !!email && CHINA_SITE_ALLOWLIST.has(email.toLowerCase());
}
