/**
 * Single source of truth for country-specific provider compliance rules:
 * which documents are required, whether an ABN is required, etc. The
 * register wizard, the /provider/compliance page, and tryAutoApproveProvider
 * all read from here so the three never drift apart.
 */
export type CountryCode = "AU" | "US" | "CA";

/** Compliance document types we gate on (subset of documentTypeEnum). */
export type ComplianceDocType = "police_check" | "first_aid" | "insurance";

export interface CountryComplianceRules {
  /** AU providers must supply an active 11-digit ABN; others don't. */
  requiresAbn: boolean;
  /** Docs that must be uploaded AND approved (and unexpired) before going live. */
  requiredDocs: ComplianceDocType[];
  /** Docs the provider may upload but that don't block activation. */
  optionalDocs: ComplianceDocType[];
}

const RULES: Record<CountryCode, CountryComplianceRules> = {
  AU: {
    requiresAbn: true,
    requiredDocs: ["police_check", "first_aid", "insurance"],
    optionalDocs: [],
  },
  US: {
    requiresAbn: false,
    requiredDocs: ["police_check", "first_aid"],
    optionalDocs: ["insurance"],
  },
  CA: {
    requiresAbn: false,
    requiredDocs: ["police_check", "first_aid", "insurance"],
    optionalDocs: [],
  },
};

function isCountryCode(c: string): c is CountryCode {
  return c === "AU" || c === "US" || c === "CA";
}

/** Rules for `country`; unknown values fall back to AU (the strictest). */
export function complianceRules(country: string | null | undefined): CountryComplianceRules {
  return country && isCountryCode(country) ? RULES[country] : RULES.AU;
}

export function requiredDocTypes(country: string | null | undefined): ComplianceDocType[] {
  return complianceRules(country).requiredDocs;
}

/** All doc types relevant to a country (required first, then optional). */
export function allComplianceDocTypes(country: string | null | undefined): ComplianceDocType[] {
  const r = complianceRules(country);
  return [...r.requiredDocs, ...r.optionalDocs];
}

export function requiresAbn(country: string | null | undefined): boolean {
  return complianceRules(country).requiresAbn;
}
