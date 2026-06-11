/**
 * Phase 2 B2B Provider Management
 * Target: Aged care facilities, nursing agencies, community organizations
 * 6 modules: Org management, Roster, AI matching, Analytics, Claims, Financial
 */

export type OrgType = 'agency' | 'facility' | 'community';
export type OrgRole = 'org_admin' | 'roster_manager' | 'finance_officer' | 'team_lead' | 'carer';

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  abn?: string;
  ndisRegistrationNumber?: string;
  insurancePolicy?: string;
  insuranceExpiry?: Date;
  contactEmail: string;
  contactPhone: string;
  address: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
}

export interface OrgMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface RosterEntry {
  id: string;
  organizationId: string;
  providerId: string;
  bookingId?: string;
  clientId: string;
  serviceDate: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurringPattern?: string;
  notes?: string;
}

// AI-Powered Provider Matching
export interface MatchScore {
  providerId: string;
  totalScore: number;
  breakdown: {
    skills: number;       // 25% weight
    availability: number; // 20%
    rating: number;       // 20%
    continuity: number;   // 15%
    language: number;     // 10%
    punctuality: number;  // 10%
  };
  tier: string;
  distance?: number;
}

const MATCH_WEIGHTS = {
  skills: 0.25,
  availability: 0.20,
  rating: 0.20,
  continuity: 0.15,
  language: 0.10,
  punctuality: 0.10,
};

/**
 * AI provider matching with composite scoring
 */
export function matchProviders(params: {
  serviceCategory: string;
  requiredSkills: string[];
  clientLanguages: string[];
  preferredProviderId?: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  candidates: {
    id: string;
    skills: string[];
    languages: string[];
    rating: number;
    totalBookings: number;
    previousClientBookings: number;
    punctualityRate: number;
    tier: string;
    isAvailable: boolean;
    distance?: number;
  }[];
}): MatchScore[] {
  const { requiredSkills, clientLanguages, preferredProviderId, urgency, candidates } = params;

  // Filter by tier for urgent/emergency
  let filtered = candidates.filter(c => c.isAvailable);
  if (urgency === 'emergency') {
    filtered = filtered.filter(c => c.tier === 'platinum');
  } else if (urgency === 'urgent') {
    filtered = filtered.filter(c => ['platinum', 'gold', 'silver'].includes(c.tier));
  }

  const scores: MatchScore[] = filtered.map(provider => {
    // Skills match (0-1)
    const skillMatch = requiredSkills.length > 0
      ? requiredSkills.filter(s => provider.skills.includes(s)).length / requiredSkills.length
      : 1;

    // Availability (binary for now)
    const availability = provider.isAvailable ? 1 : 0;

    // Rating normalized (0-1, where 5.0 = 1.0)
    const rating = provider.rating / 5;

    // Continuity bonus (same provider for client)
    let continuity = 0;
    if (provider.id === preferredProviderId) continuity = 1;
    else if (provider.previousClientBookings > 5) continuity = 0.8;
    else if (provider.previousClientBookings > 0) continuity = 0.5;

    // Language match
    const langMatch = clientLanguages.length > 0
      ? clientLanguages.filter(l => provider.languages.includes(l)).length / clientLanguages.length
      : 1;

    // Punctuality (0-1)
    const punctuality = provider.punctualityRate;

    const totalScore = (
      skillMatch * MATCH_WEIGHTS.skills +
      availability * MATCH_WEIGHTS.availability +
      rating * MATCH_WEIGHTS.rating +
      continuity * MATCH_WEIGHTS.continuity +
      langMatch * MATCH_WEIGHTS.language +
      punctuality * MATCH_WEIGHTS.punctuality
    );

    return {
      providerId: provider.id,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        skills: skillMatch,
        availability,
        rating,
        continuity,
        language: langMatch,
        punctuality,
      },
      tier: provider.tier,
      distance: provider.distance,
    };
  });

  return scores.sort((a, b) => b.totalScore - a.totalScore);
}

// Workforce Analytics
export interface WorkforceMetrics {
  organizationId: string;
  period: string;
  utilization: { rate: number; bookedHours: number; availableHours: number };
  compliance: { rate: number; fullyCompliant: number; total: number };
  financial: { revenue: number; costs: number; margin: number };
  performance: { avgRating: number; punctualityRate: number; completionRate: number };
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Calculate workforce analytics for an organization
 */
export function calculateWorkforceMetrics(params: {
  organizationId: string;
  period: string;
  rosterEntries: RosterEntry[];
  providers: { id: string; availableHours: number; isCompliant: boolean; rating: number; punctuality: number }[];
  revenue: number;
  costs: number;
  previousPeriodMetrics?: WorkforceMetrics;
}): WorkforceMetrics {
  const { organizationId, period, rosterEntries, providers, revenue, costs, previousPeriodMetrics } = params;

  const completedEntries = rosterEntries.filter(r => r.status === 'completed');
  const bookedHours = completedEntries.length * 2; // Assume 2h avg
  const availableHours = providers.reduce((sum, p) => sum + p.availableHours, 0);
  const utilizationRate = availableHours > 0 ? bookedHours / availableHours : 0;

  const compliantProviders = providers.filter(p => p.isCompliant).length;
  const complianceRate = providers.length > 0 ? compliantProviders / providers.length : 0;

  const avgRating = providers.length > 0
    ? providers.reduce((sum, p) => sum + p.rating, 0) / providers.length
    : 0;
  const avgPunctuality = providers.length > 0
    ? providers.reduce((sum, p) => sum + p.punctuality, 0) / providers.length
    : 0;
  const completionRate = rosterEntries.length > 0
    ? completedEntries.length / rosterEntries.length
    : 0;

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (previousPeriodMetrics) {
    const prevUtil = previousPeriodMetrics.utilization.rate;
    if (utilizationRate > prevUtil * 1.05) trend = 'improving';
    else if (utilizationRate < prevUtil * 0.95) trend = 'declining';
  }

  return {
    organizationId,
    period,
    utilization: { rate: Math.round(utilizationRate * 100) / 100, bookedHours, availableHours },
    compliance: { rate: Math.round(complianceRate * 100) / 100, fullyCompliant: compliantProviders, total: providers.length },
    financial: { revenue, costs, margin: revenue > 0 ? Math.round((revenue - costs) / revenue * 100) / 100 : 0 },
    performance: {
      avgRating: Math.round(avgRating * 100) / 100,
      punctualityRate: Math.round(avgPunctuality * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
    },
    trend,
  };
}
