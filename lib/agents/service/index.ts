/**
 * SilverConnect Global — Service Agent
 * 
 * Responsible for:
 * - Provider matching & smart ranking
 * - Booking lifecycle management
 * - Service quality monitoring
 * - Availability scheduling
 * - Review aggregation & provider scoring
 * 
 * Deployable as: standalone Next.js API service or serverless functions
 * Dependencies: PostgreSQL, Redis (optional for caching)
 */

export interface ServiceAgentConfig {
  dbUrl: string;
  cacheUrl?: string;
  rankingWeights: {
    distance: number;   // default 0.40
    quality: number;    // default 0.35
    price: number;      // default 0.15
    reliability: number; // default 0.10
  };
  maxSearchRadius: number; // km
  matchingAlgorithm: "smart" | "nearest" | "cheapest" | "highest_rated";
}

export const DEFAULT_SERVICE_CONFIG: ServiceAgentConfig = {
  dbUrl: process.env.DATABASE_URL || "",
  rankingWeights: { distance: 0.40, quality: 0.35, price: 0.15, reliability: 0.10 },
  maxSearchRadius: 50,
  matchingAlgorithm: "smart",
};

/** Service Agent capabilities */
export const SERVICE_AGENT_CAPABILITIES = [
  "provider_search",        // Find providers by category + location
  "smart_ranking",          // Rank by composite score
  "booking_create",         // Create new bookings
  "booking_lifecycle",      // Accept/start/complete/cancel
  "availability_check",     // Check provider availability
  "review_management",      // Submit/aggregate reviews
  "quality_scoring",        // Calculate provider quality scores
  "schedule_optimization",  // Suggest optimal booking times
] as const;

export type ServiceCapability = typeof SERVICE_AGENT_CAPABILITIES[number];
