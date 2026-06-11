/**
 * Evidence-Based Feedback Fairness System
 * Protects providers from unfair reviews while maintaining accountability
 */

export type EvidenceType = 'photo' | 'video' | 'voice' | 'screenshot' | 'text';

export interface EvidenceRequirement {
  minRating: number;
  maxRating: number;
  requiresEvidence: boolean;
  evidenceTypes: EvidenceType[];
  minTextLength: number;
  description: string;
}

export interface FeedbackSubmission {
  bookingId: string;
  customerId: string;
  providerId: string;
  ratings: {
    safety: number;
    quality: number;
    punctuality: number;
    communication: number;
    overall: number;
  };
  comment?: string;
  evidence?: { type: EvidenceType; url: string; description?: string }[];
}

export interface DisputeRequest {
  feedbackId: string;
  providerId: string;
  reason: string;
  counterEvidence?: { type: EvidenceType; url: string; description?: string }[];
}

// Evidence requirements by rating
const REQUIREMENTS: EvidenceRequirement[] = [
  { minRating: 4, maxRating: 5, requiresEvidence: false, evidenceTypes: [], minTextLength: 0, description: 'No evidence needed for positive reviews' },
  { minRating: 3, maxRating: 3.99, requiresEvidence: true, evidenceTypes: ['text'], minTextLength: 50, description: 'Written explanation required (50+ chars)' },
  { minRating: 1, maxRating: 2.99, requiresEvidence: true, evidenceTypes: ['photo', 'video', 'voice', 'screenshot', 'text'], minTextLength: 100, description: 'Photo/video/voice evidence OR detailed text (100+ chars)' },
];

/**
 * Get evidence requirements for a given rating
 */
export function getRequirements(overallRating: number): EvidenceRequirement {
  return REQUIREMENTS.find(r => overallRating >= r.minRating && overallRating <= r.maxRating) || REQUIREMENTS[0];
}

/**
 * Validate feedback submission against evidence requirements
 */
export function validateFeedback(submission: FeedbackSubmission): { valid: boolean; error?: string } {
  const avgRating = (
    submission.ratings.safety + submission.ratings.quality +
    submission.ratings.punctuality + submission.ratings.communication +
    submission.ratings.overall
  ) / 5;

  const req = getRequirements(avgRating);

  if (!req.requiresEvidence) return { valid: true };

  // Check for evidence
  const hasMediaEvidence = submission.evidence && submission.evidence.some(
    e => ['photo', 'video', 'voice', 'screenshot'].includes(e.type)
  );

  const hasTextEvidence = submission.comment && submission.comment.length >= req.minTextLength;

  if (avgRating < 3) {
    // Rating 1-2: needs media OR detailed text
    if (!hasMediaEvidence && !hasTextEvidence) {
      return {
        valid: false,
        error: `Ratings below 3 require photo/video evidence OR a detailed explanation (${req.minTextLength}+ characters). This protects providers from unfair reviews.`,
      };
    }
  } else {
    // Rating 3: needs written explanation
    if (!hasTextEvidence) {
      return {
        valid: false,
        error: `A written explanation of at least ${req.minTextLength} characters is required for this rating.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Check if customer is a serial bad reviewer (pattern detection)
 * Auto-quarantine if 3+ bad reviews in 30 days
 */
export function detectReviewPattern(recentReviews: { rating: number; date: Date }[]): {
  isPattern: boolean;
  shouldQuarantine: boolean;
  reason?: string;
} {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentBad = recentReviews.filter(r => r.rating < 3 && r.date > thirtyDaysAgo);

  if (recentBad.length >= 3) {
    return {
      isPattern: true,
      shouldQuarantine: true,
      reason: `Customer has left ${recentBad.length} negative reviews in 30 days. Auto-quarantining for review.`,
    };
  }

  return { isPattern: false, shouldQuarantine: false };
}

/**
 * Process dispute resolution (admin action)
 */
export type DisputeResolution = 'upheld' | 'dismissed' | 'removed';

export function resolveDispute(resolution: DisputeResolution): {
  reviewExcluded: boolean;
  reviewDeleted: boolean;
  message: string;
} {
  switch (resolution) {
    case 'upheld':
      return { reviewExcluded: true, reviewDeleted: false, message: 'Dispute upheld — review excluded from ranking permanently' };
    case 'dismissed':
      return { reviewExcluded: false, reviewDeleted: false, message: 'Dispute dismissed — review counts toward ranking' };
    case 'removed':
      return { reviewExcluded: true, reviewDeleted: true, message: 'Malicious review removed and deleted' };
  }
}
