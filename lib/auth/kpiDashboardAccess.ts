/**
 * The founder/financial KPI dashboard (app/[locale]/(admin)/admin/kpi-dashboard)
 * is restricted to the platform owner only — unlike govt-funding access
 * (lib/auth/govtFundingAccess.ts), this isn't a multi-grant list, so a
 * single hardcoded email is the right scope. Mirrors the same shape as
 * that file for consistency.
 */
const KPI_DASHBOARD_ALLOWLIST = new Set(["zhili@phledger.com"]);

export function hasKpiDashboardAccess(email: string | null | undefined): boolean {
  return !!email && KPI_DASHBOARD_ALLOWLIST.has(email.toLowerCase());
}
