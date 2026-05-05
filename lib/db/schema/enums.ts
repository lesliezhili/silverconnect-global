import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["customer", "provider", "admin"]);
export const countryEnum = pgEnum("country", ["AU", "CN", "CA"]);
export const localeEnum = pgEnum("locale", ["en", "zh"]);

export const serviceCategoryEnum = pgEnum("service_category", [
  "cleaning",
  "cooking",
  "garden",
  "personalCare",
  "repair",
]);

export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "pending",
  "docs_review",
  "approved",
  "rejected",
  "suspended",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "police_check",
  "first_aid",
  "insurance",
  "identity",
  "wwc",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);

export const timeSlotEnum = pgEnum("time_slot", ["morning", "afternoon", "evening"]);

export const verificationPurposeEnum = pgEnum("verification_purpose", [
  "email_verify",
  "password_reset",
]);

export const badgeKindEnum = pgEnum("badge_kind", [
  "verified",
  "top_rated",
  "fast_responder",
  "five_year",
  "first_aid_certified",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
  "released",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "captured",
  "refunded",
  "failed",
]);

export const recurrenceFreqEnum = pgEnum("recurrence_freq", [
  "weekly",
  "biweekly",
  "monthly",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "paid",
  "failed",
]);

export const bookingChangeTypeEnum = pgEnum("booking_change_type", [
  "created",
  "status_change",
  "reschedule",
  "cancel",
  "refund",
]);
