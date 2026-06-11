/**
 * 24h Cancellation Policy Engine
 * AU NDIS-aligned policy with multi-country support
 */

export type CancellationReason = 'customer_request' | 'provider_unavailable' | 'emergency' | 'weather' | 'no_show' | 'other';

export interface CancellationPolicy {
  refundPercent: number;
  providerCompPercent: number;
  platformKeep: number;
  description: string;
}

export interface CancellationQuote {
  bookingId: string;
  originalAmount: number;
  refundAmount: number;
  providerCompensation: number;
  platformFee: number;
  policy: CancellationPolicy;
  noticePeriod: string;
  hoursNotice: number;
}

// AU NDIS-aligned cancellation tiers
const AU_POLICY: Record<string, CancellationPolicy> = {
  '7d+': { refundPercent: 100, providerCompPercent: 0, platformKeep: 0, description: '7+ days notice: Full refund' },
  '48h-7d': { refundPercent: 100, providerCompPercent: 0, platformKeep: 0, description: '48h-7d notice: Full refund' },
  '24h-48h': { refundPercent: 50, providerCompPercent: 50, platformKeep: 0, description: '24-48h notice: 50% refund' },
  '<24h': { refundPercent: 0, providerCompPercent: 90, platformKeep: 10, description: '<24h notice: No refund' },
  'no_show': { refundPercent: 0, providerCompPercent: 90, platformKeep: 10, description: 'No-show: No refund' },
};

const CN_POLICY: Record<string, CancellationPolicy> = {
  '48h+': { refundPercent: 100, providerCompPercent: 0, platformKeep: 0, description: '48h+ notice: Full refund' },
  '24h-48h': { refundPercent: 70, providerCompPercent: 30, platformKeep: 0, description: '24-48h: 70% refund' },
  '12h-24h': { refundPercent: 30, providerCompPercent: 60, platformKeep: 10, description: '12-24h: 30% refund' },
  '<12h': { refundPercent: 0, providerCompPercent: 85, platformKeep: 15, description: '<12h: No refund' },
  'no_show': { refundPercent: 0, providerCompPercent: 85, platformKeep: 15, description: 'No-show: No refund' },
};

const CA_POLICY: Record<string, CancellationPolicy> = {
  '72h+': { refundPercent: 100, providerCompPercent: 0, platformKeep: 0, description: '72h+ notice: Full refund' },
  '24h-72h': { refundPercent: 75, providerCompPercent: 25, platformKeep: 0, description: '24-72h: 75% refund' },
  '<24h': { refundPercent: 25, providerCompPercent: 65, platformKeep: 10, description: '<24h: 25% refund' },
  'no_show': { refundPercent: 0, providerCompPercent: 85, platformKeep: 15, description: 'No-show: No refund' },
};

/**
 * Get applicable cancellation policy based on notice period and country
 */
export function getCancellationPolicy(hoursNotice: number, country: string = 'AU', isNoShow: boolean = false): CancellationPolicy {
  if (isNoShow) {
    return (country === 'CN' ? CN_POLICY : country === 'CA' ? CA_POLICY : AU_POLICY)['no_show'];
  }

  if (country === 'AU') {
    if (hoursNotice >= 168) return AU_POLICY['7d+'];
    if (hoursNotice >= 48) return AU_POLICY['48h-7d'];
    if (hoursNotice >= 24) return AU_POLICY['24h-48h'];
    return AU_POLICY['<24h'];
  }

  if (country === 'CN') {
    if (hoursNotice >= 48) return CN_POLICY['48h+'];
    if (hoursNotice >= 24) return CN_POLICY['24h-48h'];
    if (hoursNotice >= 12) return CN_POLICY['12h-24h'];
    return CN_POLICY['<12h'];
  }

  // CA
  if (hoursNotice >= 72) return CA_POLICY['72h+'];
  if (hoursNotice >= 24) return CA_POLICY['24h-72h'];
  return CA_POLICY['<24h'];
}

/**
 * Calculate cancellation quote
 */
export function calculateCancellationQuote(params: {
  bookingId: string;
  totalAmount: number;
  serviceDate: Date;
  country?: string;
  isNoShow?: boolean;
}): CancellationQuote {
  const { bookingId, totalAmount, serviceDate, country = 'AU', isNoShow = false } = params;
  
  const now = new Date();
  const hoursNotice = Math.max(0, (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const policy = getCancellationPolicy(hoursNotice, country, isNoShow);

  const refundAmount = Math.round(totalAmount * (policy.refundPercent / 100) * 100) / 100;
  const providerCompensation = Math.round(totalAmount * (policy.providerCompPercent / 100) * 100) / 100;
  const platformFee = Math.round(totalAmount * (policy.platformKeep / 100) * 100) / 100;

  let noticePeriod = '';
  if (isNoShow) noticePeriod = 'no-show';
  else if (hoursNotice >= 168) noticePeriod = '7+ days';
  else if (hoursNotice >= 72) noticePeriod = '72h+';
  else if (hoursNotice >= 48) noticePeriod = '48h-7d';
  else if (hoursNotice >= 24) noticePeriod = '24-48h';
  else if (hoursNotice >= 12) noticePeriod = '12-24h';
  else noticePeriod = '<12h';

  return {
    bookingId,
    originalAmount: totalAmount,
    refundAmount,
    providerCompensation,
    platformFee,
    policy,
    noticePeriod,
    hoursNotice: Math.round(hoursNotice * 10) / 10,
  };
}
