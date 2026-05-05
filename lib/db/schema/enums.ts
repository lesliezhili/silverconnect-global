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
