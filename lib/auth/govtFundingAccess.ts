/**
 * Government-funded program features (NDIS, TAC, WorkSafe, DVA, My Aged
 * Care, Aged Pension/CHSP, Super) are currently limited to a small
 * allowlist of accounts. Everyone else sees the self-funded / private-pay
 * experience only.
 */
const GOVT_FUNDING_ALLOWLIST = new Set([
  "zhili@phledger.com",
  "lee_5210@hotmail.com",
  "lesliezhi.li@gmail.com",
]);

export function hasGovtFundingAccess(email: string | null | undefined): boolean {
  return !!email && GOVT_FUNDING_ALLOWLIST.has(email.toLowerCase());
}
