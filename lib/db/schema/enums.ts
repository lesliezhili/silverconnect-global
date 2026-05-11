import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["customer", "provider", "admin"]);
export const countryEnum = pgEnum("country", ["AU", "US", "CA"]);
export const localeEnum = pgEnum("locale", ["en", "zh-CN", "zh-TW", "ja", "ko"]);

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

export const reviewStatusEnum = pgEnum("review_status", [
  "published",
  "hidden",
  "reported",
  "removed",
]);

export const reviewReportReasonEnum = pgEnum("review_report_reason", [
  "spam",
  "abusive",
  "false",
  "off_topic",
  "other",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "evidence_needed",
  "decided",
  "closed",
]);

export const disputeResolutionEnum = pgEnum("dispute_resolution", [
  "refund_full",
  "refund_partial",
  "denied",
  "withdrawn",
]);

export const safetySeverityEnum = pgEnum("safety_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const safetyStatusEnum = pgEnum("safety_status", [
  "open",
  "acknowledged",
  "resolved",
  "dismissed",
]);

export const notificationKindEnum = pgEnum("notification_kind", [
  "booking_update",
  "payment",
  "dispute",
  "safety",
  "review",
  "system",
  "marketing",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "push",
  "email",
  "sms",
]);

export const aiMessageRoleEnum = pgEnum("ai_message_role", [
  "user",
  "assistant",
  "system",
]);

export const donationModeEnum = pgEnum("donation_mode", ["once", "monthly"]);

// Status semantics differ by mode:
//   once    : pending → completed | failed
//   monthly : pending → active → cancelled (+ failed if Checkout never completes)
export const donationStatusEnum = pgEnum("donation_status", [
  "pending",
  "completed",
  "active",
  "cancelled",
  "failed",
]);

// donation_payments only stores money that actually moved.
export const donationPaymentStatusEnum = pgEnum("donation_payment_status", [
  "succeeded",
  "partially_refunded",
  "refunded",
]);

export const processedStripeEventStatusEnum = pgEnum(
  "processed_stripe_event_status",
  ["processing", "succeeded", "failed"],
);
