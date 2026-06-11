/**
 * Provider Security Verification System
 * 8 check types, country-specific requirements, expiry monitoring
 */

export type CheckType = 
  | 'police_check'
  | 'wwc'
  | 'ndis_worker_screening'
  | 'first_aid'
  | 'identity_100pt'
  | 'right_to_work'
  | 'professional_registration'
  | 'insurance';

export type CheckStatus = 'pending' | 'submitted' | 'verified' | 'expired' | 'rejected';

export interface SecurityCheck {
  id: string;
  providerId: string;
  checkType: CheckType;
  status: CheckStatus;
  documentUrl?: string;
  documentNumber?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface VerificationStatus {
  providerId: string;
  country: string;
  checks: SecurityCheck[];
  isFullyVerified: boolean;
  missingChecks: CheckType[];
  expiringChecks: SecurityCheck[]; // Within 30 days
  expiredChecks: SecurityCheck[];
}

// Required checks by country
const REQUIRED_CHECKS: Record<string, CheckType[]> = {
  AU: ['police_check', 'wwc', 'ndis_worker_screening', 'first_aid', 'insurance'],
  CN: ['police_check', 'identity_100pt', 'insurance'],
  CA: ['police_check', 'identity_100pt', 'insurance'],
};

// Check metadata
const CHECK_INFO: Record<CheckType, { name: string; validityMonths: number; description: string }> = {
  police_check: { name: 'National Police Check', validityMonths: 36, description: 'Criminal history check from Australian Federal Police or state equivalent' },
  wwc: { name: 'Working With Children', validityMonths: 60, description: 'WWC check for working with vulnerable people' },
  ndis_worker_screening: { name: 'NDIS Worker Screening', validityMonths: 60, description: 'Mandatory screening for NDIS workers under the NDIS Quality and Safeguards Commission' },
  first_aid: { name: 'First Aid Certificate', validityMonths: 36, description: 'HLTAID011 Provide First Aid (or equivalent)' },
  identity_100pt: { name: '100-Point Identity Check', validityMonths: 0, description: 'One-time identity verification (passport, license, etc.)' },
  right_to_work: { name: 'Right to Work', validityMonths: 12, description: 'VEVO check for work rights in country' },
  professional_registration: { name: 'Professional Registration', validityMonths: 12, description: 'AHPRA or relevant professional body registration' },
  insurance: { name: 'Professional Indemnity Insurance', validityMonths: 12, description: 'Public liability and professional indemnity coverage' },
};

/**
 * Get verification status for a provider
 */
export function getVerificationStatus(providerId: string, country: string, checks: SecurityCheck[]): VerificationStatus {
  const required = REQUIRED_CHECKS[country] || REQUIRED_CHECKS.AU;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const verifiedChecks = checks.filter(c => c.status === 'verified');
  const verifiedTypes = new Set(verifiedChecks.map(c => c.checkType));
  const missingChecks = required.filter(t => !verifiedTypes.has(t));

  const expiringChecks = checks.filter(c => 
    c.status === 'verified' && c.expiryDate && c.expiryDate <= thirtyDaysFromNow && c.expiryDate > now
  );

  const expiredChecks = checks.filter(c =>
    c.expiryDate && c.expiryDate <= now
  );

  return {
    providerId,
    country,
    checks,
    isFullyVerified: missingChecks.length === 0 && expiredChecks.length === 0,
    missingChecks,
    expiringChecks,
    expiredChecks,
  };
}

/**
 * Check documents expiring within N days (for cron job)
 */
export async function checkExpiringDocuments(db: any, daysAhead: number = 30): Promise<SecurityCheck[]> {
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const now = new Date();

  const result = await db.query(`
    SELECT * FROM provider_security_checks
    WHERE status = 'verified'
    AND expiry_date IS NOT NULL
    AND expiry_date <= $1
    AND expiry_date > $2
  `, [futureDate, now]);

  return result?.rows || [];
}

/**
 * Get required checks info for a country
 */
export function getRequiredChecksForCountry(country: string): { type: CheckType; info: typeof CHECK_INFO[CheckType] }[] {
  const required = REQUIRED_CHECKS[country] || REQUIRED_CHECKS.AU;
  return required.map(type => ({ type, info: CHECK_INFO[type] }));
}
