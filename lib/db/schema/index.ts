// Phase 1: auth + provider (12 tables)
export * from "./enums";
export * from "./users";
export * from "./customer-data";
export * from "./providers";

// Phase 2: services + bookings + payments (10 tables)
export * from "./services";
export * from "./bookings";
export * from "./payments";

// Phase 3: reviews + disputes + safety + notifications + ai + admin (17 tables)
export * from "./reviews";
export * from "./disputes";
export * from "./safety";
export * from "./notifications";
export * from "./ai";
export * from "./admin";

// Xinyuzhe intake: unauthenticated booking requests
export * from "./booking-requests";

// Phase 4: B2B day care centre registration
export * from "./organizations";

// Phase 5: referral program
export * from "./referrals";

// Phase 6: general platform donations
export * from "./donations";

// Phase 7: internal non-financial coin ledger (AU only)
export * from "./coins";

// Phase 8: admin-managed government-funding-scheme access grants
export * from "./govtFunding";
