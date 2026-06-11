-- Migration: 0000_plain_zaran.sql
CREATE TYPE "public"."badge_kind" AS ENUM('verified', 'top_rated', 'fast_responder', 'five_year', 'first_aid_certified');
CREATE TYPE "public"."country" AS ENUM('AU', 'CN', 'CA');
CREATE TYPE "public"."document_status" AS ENUM('pending', 'approved', 'rejected', 'expired');
CREATE TYPE "public"."document_type" AS ENUM('police_check', 'first_aid', 'insurance', 'identity', 'wwc');
CREATE TYPE "public"."locale" AS ENUM('en', 'zh');
CREATE TYPE "public"."onboarding_status" AS ENUM('pending', 'docs_review', 'approved', 'rejected', 'suspended');
CREATE TYPE "public"."role" AS ENUM('customer', 'provider', 'admin');
CREATE TYPE "public"."service_category" AS ENUM('cleaning', 'cooking', 'garden', 'personalCare', 'repair');
CREATE TYPE "public"."time_slot" AS ENUM('morning', 'afternoon', 'evening');
CREATE TYPE "public"."verification_purpose" AS ENUM('email_verify', 'password_reset');
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"country" "country" DEFAULT 'AU' NOT NULL,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"name" text,
	"avatar_url" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"purpose" "verification_purpose" DEFAULT 'email_verify' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text,
	"postcode" text,
	"country" "country" NOT NULL,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"phone" text NOT NULL,
	"email" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"phone" text,
	"email" text,
	"can_book_for_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_payment_method_id" text,
	"brand" text,
	"last4" text,
	"exp_month" integer,
	"exp_year" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"slot" time_slot NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);

CREATE TABLE "provider_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"kind" "badge_kind" NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"note" text
);

CREATE TABLE "provider_blocked_times" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_categories" (
	"provider_id" uuid NOT NULL,
	"category" "service_category" NOT NULL,
	CONSTRAINT "provider_categories_provider_id_category_pk" PRIMARY KEY("provider_id","category")
);

CREATE TABLE "provider_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"type" "document_type" NOT NULL,
	"file_url" text NOT NULL,
	"document_number" text,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"address_line" text,
	"service_lat" numeric(9, 6),
	"service_lng" numeric(9, 6),
	"service_radius_km" integer DEFAULT 10 NOT NULL,
	"onboarding_status" "onboarding_status" DEFAULT 'pending' NOT NULL,
	"stripe_account_id" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_badges" ADD CONSTRAINT "provider_badges_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_blocked_times" ADD CONSTRAINT "provider_blocked_times_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower("email"));
CREATE INDEX "verification_codes_email_idx" ON "verification_codes" USING btree ("email");
CREATE INDEX "verification_codes_expires_idx" ON "verification_codes" USING btree ("expires_at");
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");
CREATE INDEX "emergency_contacts_user_idx" ON "emergency_contacts" USING btree ("user_id");
CREATE INDEX "family_members_user_idx" ON "family_members" USING btree ("user_id");
CREATE INDEX "payment_methods_user_idx" ON "payment_methods" USING btree ("user_id");
CREATE UNIQUE INDEX "provider_availability_provider_day_slot_uq" ON "provider_availability" USING btree ("provider_id","day_of_week","slot");
CREATE UNIQUE INDEX "provider_badges_provider_kind_uq" ON "provider_badges" USING btree ("provider_id","kind");
CREATE INDEX "provider_blocked_times_provider_start_idx" ON "provider_blocked_times" USING btree ("provider_id","starts_at");
CREATE INDEX "provider_categories_category_idx" ON "provider_categories" USING btree ("category");
CREATE UNIQUE INDEX "provider_documents_provider_type_uq" ON "provider_documents" USING btree ("provider_id","type");
CREATE INDEX "provider_documents_provider_idx" ON "provider_documents" USING btree ("provider_id");
CREATE UNIQUE INDEX "provider_profiles_user_uq" ON "provider_profiles" USING btree ("user_id");
CREATE INDEX "provider_profiles_status_idx" ON "provider_profiles" USING btree ("onboarding_status");

-- Migration: 0001_phase2-services-bookings-payments.sql
CREATE TYPE "public"."booking_change_type" AS ENUM('created', 'status_change', 'reschedule', 'cancel', 'refund');
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed', 'released');
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'captured', 'refunded', 'failed');
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'paid', 'failed');
CREATE TYPE "public"."recurrence_freq" AS ENUM('weekly', 'biweekly', 'monthly');
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"icon_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "service_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"country" "country" NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 4) NOT NULL,
	"currency" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_code" text NOT NULL,
	"code" text NOT NULL,
	"duration_min" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "booking_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"type" "booking_change_type" NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status",
	"actor_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider_id" uuid,
	"service_id" uuid NOT NULL,
	"address_id" uuid,
	"recurring_series_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"base_price" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "recurring_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"address_id" uuid,
	"frequency" "recurrence_freq" NOT NULL,
	"start_date" date NOT NULL,
	"ends_at" timestamp with time zone,
	"weekday" integer NOT NULL,
	"hour" integer NOT NULL,
	"minute" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"stripe_payment_intent_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"captured_at" timestamp with time zone,
	"failed_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"stripe_transfer_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"stripe_refund_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"balance_pending" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_available" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "service_prices" ADD CONSTRAINT "service_prices_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "booking_changes" ADD CONSTRAINT "booking_changes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "booking_changes" ADD CONSTRAINT "booking_changes_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_recurring_series_id_recurring_series_id_fk" FOREIGN KEY ("recurring_series_id") REFERENCES "public"."recurring_series"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "service_categories_code_uq" ON "service_categories" USING btree ("code");
CREATE UNIQUE INDEX "service_prices_service_country_uq" ON "service_prices" USING btree ("service_id","country");
CREATE UNIQUE INDEX "services_code_uq" ON "services" USING btree ("code");
CREATE INDEX "services_category_idx" ON "services" USING btree ("category_code");
CREATE INDEX "booking_changes_booking_idx" ON "booking_changes" USING btree ("booking_id");
CREATE INDEX "bookings_customer_idx" ON "bookings" USING btree ("customer_id");
CREATE INDEX "bookings_provider_idx" ON "bookings" USING btree ("provider_id");
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");
CREATE INDEX "bookings_scheduled_idx" ON "bookings" USING btree ("scheduled_at");
CREATE INDEX "recurring_series_customer_idx" ON "recurring_series" USING btree ("customer_id");
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");
CREATE UNIQUE INDEX "payments_stripe_pi_uq" ON "payments" USING btree ("stripe_payment_intent_id");
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");
CREATE INDEX "payouts_provider_idx" ON "payouts" USING btree ("provider_id");
CREATE UNIQUE INDEX "payouts_stripe_transfer_uq" ON "payouts" USING btree ("stripe_transfer_id");
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");
CREATE INDEX "refunds_payment_idx" ON "refunds" USING btree ("payment_id");
CREATE UNIQUE INDEX "refunds_stripe_refund_uq" ON "refunds" USING btree ("stripe_refund_id");
CREATE UNIQUE INDEX "wallets_provider_uq" ON "wallets" USING btree ("provider_id");

-- Migration: 0002_phase3-reviews-disputes-safety-notifications-ai-admin.sql
CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'system');
CREATE TYPE "public"."dispute_resolution" AS ENUM('refund_full', 'refund_partial', 'denied', 'withdrawn');
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'evidence_needed', 'decided', 'closed');
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'push', 'email', 'sms');
CREATE TYPE "public"."notification_kind" AS ENUM('booking_update', 'payment', 'dispute', 'safety', 'review', 'system', 'marketing');
CREATE TYPE "public"."review_report_reason" AS ENUM('spam', 'abusive', 'false', 'off_topic', 'other');
CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden', 'reported', 'removed');
CREATE TYPE "public"."safety_severity" AS ENUM('low', 'medium', 'high', 'critical');
CREATE TYPE "public"."safety_status" AS ENUM('open', 'acknowledged', 'resolved', 'dismissed');
CREATE TABLE "review_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "review_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" "review_report_reason" NOT NULL,
	"details" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution_action" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "dispute_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"kind" text NOT NULL,
	"file_url" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "dispute_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"is_admin_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"raised_by" uuid NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"reason" text NOT NULL,
	"resolution" "dispute_resolution",
	"resolution_amount" numeric(10, 2),
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"decision_note" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "incident_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"category" text NOT NULL,
	"body" text NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"action" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "safety_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"kind" text NOT NULL,
	"severity" "safety_severity" DEFAULT 'medium' NOT NULL,
	"status" "safety_status" DEFAULT 'open' NOT NULL,
	"description" text,
	"location_lat" numeric(9, 6),
	"location_lng" numeric(9, 6),
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notification_prefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"related_booking_id" uuid,
	"related_dispute_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"closed_at" timestamp with time zone,
	"emergency_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_emergency_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"locale" "locale" NOT NULL,
	"severity" "safety_severity" DEFAULT 'high' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_kb" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"locale" "locale" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "admin_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" "role",
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"ip" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "safety_events" ADD CONSTRAINT "safety_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "safety_events" ADD CONSTRAINT "safety_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "safety_events" ADD CONSTRAINT "safety_events_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_booking_id_bookings_id_fk" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_dispute_id_disputes_id_fk" FOREIGN KEY ("related_dispute_id") REFERENCES "public"."disputes"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "review_replies_review_uq" ON "review_replies" USING btree ("review_id");
CREATE INDEX "review_reports_review_idx" ON "review_reports" USING btree ("review_id");
CREATE UNIQUE INDEX "review_reports_reporter_review_uq" ON "review_reports" USING btree ("reporter_id","review_id");
CREATE UNIQUE INDEX "reviews_booking_uq" ON "reviews" USING btree ("booking_id");
CREATE INDEX "reviews_provider_idx" ON "reviews" USING btree ("provider_id");
CREATE INDEX "reviews_customer_idx" ON "reviews" USING btree ("customer_id");
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");
CREATE INDEX "dispute_evidence_dispute_idx" ON "dispute_evidence" USING btree ("dispute_id");
CREATE INDEX "dispute_messages_dispute_idx" ON "dispute_messages" USING btree ("dispute_id");
CREATE INDEX "disputes_booking_idx" ON "disputes" USING btree ("booking_id");
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");
CREATE INDEX "incident_reports_user_idx" ON "incident_reports" USING btree ("user_id");
CREATE INDEX "incident_reports_category_idx" ON "incident_reports" USING btree ("category");
CREATE INDEX "safety_events_user_idx" ON "safety_events" USING btree ("user_id");
CREATE INDEX "safety_events_status_idx" ON "safety_events" USING btree ("status");
CREATE INDEX "safety_events_severity_idx" ON "safety_events" USING btree ("severity");
CREATE INDEX "safety_events_triggered_idx" ON "safety_events" USING btree ("triggered_at");
CREATE UNIQUE INDEX "notification_prefs_user_channel_kind_uq" ON "notification_prefs" USING btree ("user_id","channel","kind");
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");
CREATE INDEX "ai_conversations_user_idx" ON "ai_conversations" USING btree ("user_id");
CREATE UNIQUE INDEX "ai_emergency_keywords_keyword_locale_uq" ON "ai_emergency_keywords" USING btree ("keyword","locale");
CREATE INDEX "ai_kb_category_locale_idx" ON "ai_kb" USING btree ("category","locale");
CREATE INDEX "ai_messages_conversation_idx" ON "ai_messages" USING btree ("conversation_id");
CREATE INDEX "admin_actions_admin_created_idx" ON "admin_actions" USING btree ("admin_id","created_at");
CREATE INDEX "admin_actions_target_idx" ON "admin_actions" USING btree ("target_type","target_id");
CREATE UNIQUE INDEX "admin_settings_key_uq" ON "admin_settings" USING btree ("key");
CREATE INDEX "audit_log_actor_created_idx" ON "audit_log" USING btree ("actor_id","created_at");
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_type","target_id");

-- Migration: 0003_phase3-fixup-nullable-fks.sql
ALTER TABLE "review_reports" ALTER COLUMN "reporter_id" DROP NOT NULL;
ALTER TABLE "disputes" ALTER COLUMN "raised_by" DROP NOT NULL;
ALTER TABLE "admin_actions" ALTER COLUMN "admin_id" DROP NOT NULL;

-- Migration: 0004_melodic_iron_fist.sql
CREATE TYPE "public"."active_role" AS ENUM('customer', 'provider', 'helper', 'admin');
CREATE TYPE "public"."supported_language" AS ENUM('en', 'zh', 'zh_tw', 'th', 'ko', 'ja');
CREATE TABLE "user_representatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"elder_user_id" uuid NOT NULL,
	"representative_user_id" uuid NOT NULL,
	"authorization_doc_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);

CREATE TABLE "user_role_switches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_role" text NOT NULL,
	"to_role" text NOT NULL,
	"switched_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "provider_categories" ALTER COLUMN "category" SET DATA TYPE text;
DROP TYPE "public"."service_category";
CREATE TYPE "public"."service_category" AS ENUM('cleaning', 'companion', 'garden', 'personalCare', 'repair');
ALTER TABLE "provider_categories" ALTER COLUMN "category" SET DATA TYPE "public"."service_category" USING "category"::"public"."service_category";
ALTER TABLE "users" ADD COLUMN "current_active_role" text DEFAULT 'customer' NOT NULL;
ALTER TABLE "users" ADD COLUMN "full_name" text;
ALTER TABLE "users" ADD COLUMN "preferred_language" text DEFAULT 'en' NOT NULL;
ALTER TABLE "users" ADD COLUMN "large_text_mode" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;
ALTER TABLE "user_representatives" ADD CONSTRAINT "user_representatives_elder_user_id_users_id_fk" FOREIGN KEY ("elder_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_representatives" ADD CONSTRAINT "user_representatives_representative_user_id_users_id_fk" FOREIGN KEY ("representative_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_role_switches" ADD CONSTRAINT "user_role_switches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "idx_representatives_elder" ON "user_representatives" USING btree ("elder_user_id");
CREATE INDEX "idx_representatives_rep" ON "user_representatives" USING btree ("representative_user_id");
CREATE UNIQUE INDEX "user_representatives_elder_rep_uq" ON "user_representatives" USING btree ("elder_user_id","representative_user_id");
CREATE INDEX "idx_role_switches_user" ON "user_role_switches" USING btree ("user_id","switched_at");

-- Migration: 0004_module1-auth-expansion.sql
-- Module 1: Auth & User Profiles - Schema Expansion
-- Adds language fallback, role switching, accessibility, and full_name enforcement

-- Expand locale enum to support all target languages
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'th';
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'ko';
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'ja';
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'zh_tw';

-- Add missing user profile fields per spec
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS large_text_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_active_role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Role history / switching audit
CREATE TABLE IF NOT EXISTS user_role_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_role TEXT NOT NULL,
    to_role TEXT NOT NULL,
    switched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_role_switches_user ON user_role_switches(user_id, switched_at DESC);

-- Representative / helper delegation table
CREATE TABLE IF NOT EXISTS user_representatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    representative_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authorization_doc_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(elder_user_id, representative_user_id)
);
CREATE INDEX IF NOT EXISTS idx_representatives_elder ON user_representatives(elder_user_id);
CREATE INDEX IF NOT EXISTS idx_representatives_rep ON user_representatives(representative_user_id);


-- Migration: 0005_module2-provider-onboarding.sql
-- Module 2: Provider Onboarding & Availability Expansion
-- Adds ABN tracking, background check status, emergency opt-in, surge pricing

-- Add missing provider profile fields
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS abn TEXT;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS abn_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS abn_verified_at TIMESTAMPTZ;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS background_check_status TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS background_check_cleared_at TIMESTAMPTZ;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS emergency_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS base_hourly_rate DECIMAL(10,2);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS coverage_postcodes TEXT[];
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS service_tier TEXT NOT NULL DEFAULT 'level_1';

-- Background check results tracking
CREATE TABLE IF NOT EXISTS provider_background_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL, -- 'police_check', 'wwc', 'identity'
    external_reference_id TEXT, -- ID from third-party screening API
    status TEXT NOT NULL DEFAULT 'pending', -- pending, cleared, flagged, expired
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_bg_checks_provider ON provider_background_checks(provider_id);

-- Surge pricing configuration (holiday/weekend rates)
CREATE TABLE IF NOT EXISTS pricing_surcharge_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country TEXT NOT NULL, -- AU, CN, CA
    rule_type TEXT NOT NULL, -- 'public_holiday', 'weekend', 'peak_hour'
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0, -- e.g. 2.0 for holiday
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default surcharge rules
INSERT INTO pricing_surcharge_rules (country, rule_type, multiplier, description) VALUES
    ('AU', 'public_holiday', 2.0, 'Australian public holiday double rate'),
    ('AU', 'weekend', 1.5, 'Weekend loading 50%'),
    ('AU', 'peak_hour', 1.2, 'Peak hour 6-8am/5-7pm surcharge'),
    ('CN', 'public_holiday', 2.0, 'Chinese public holiday double rate'),
    ('CN', 'weekend', 1.5, 'Weekend loading 50%'),
    ('CA', 'public_holiday', 2.0, 'Canadian public holiday double rate'),
    ('CA', 'weekend', 1.5, 'Weekend loading 50%')
ON CONFLICT DO NOTHING;


-- Migration: 0006_module3-customer-onboarding.sql
-- Module 3: Customer Onboarding — GPS, preferences, rep linking
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS gps_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Customer onboarding status tracking
CREATE TYPE customer_onboarding_status AS ENUM (
    'not_started', 'profile_pending', 'address_pending', 'emergency_pending', 'ready_to_book'
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_onboarding_status TEXT NOT NULL DEFAULT 'not_started';


-- Migration: 0007_module5-escrow-phledger.sql
-- Module 5: Trust Escrow & PHledger
CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, held, released, refunded
    held_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    provider_payout DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    charity_surplus DECIMAL(10,2),
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_booking ON escrow_accounts(booking_id);

-- PHledger: Immutable append-only audit/transparency ledger
CREATE TABLE IF NOT EXISTS phledger_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number BIGSERIAL,
    transaction_type TEXT NOT NULL, -- ESCROW_LOCK, ESCROW_RELEASE, REFUND, CHARITY_DISBURSEMENT
    booking_id UUID REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    metadata JSONB,
    previous_block_hash TEXT,
    block_hash TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phledger_booking ON phledger_blocks(booking_id);
CREATE INDEX IF NOT EXISTS idx_phledger_type ON phledger_blocks(transaction_type);


-- Migration: 0008_module6-emergency-dispatch.sql
-- Module 6: Emergency Dispatch & AI Check-In
CREATE TABLE IF NOT EXISTS booking_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    lead_hours INTEGER NOT NULL, -- hours before appointment (24, 12, 6, 4, 2)
    provider_confirmed BOOLEAN,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_at TIMESTAMPTZ,
    escalated BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_checkins_booking ON booking_checkins(booking_id);

CREATE TABLE IF NOT EXISTS emergency_reroutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    original_provider_id UUID,
    replacement_provider_id UUID,
    reason TEXT NOT NULL, -- 'provider_no_response', 'provider_cancelled', 'provider_emergency'
    rerouted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_notified BOOLEAN NOT NULL DEFAULT FALSE,
    admin_escalated BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_reroutes_booking ON emergency_reroutes(booking_id);


-- Migration: 0009_module7-ai-biography.sql
-- Module 7: AI Service & Biography Engine
-- Token quota system for biography sessions
CREATE TABLE IF NOT EXISTS biography_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
    max_allowed_tokens BIGINT NOT NULL DEFAULT 500000, -- ~250 pages
    tokens_consumed BIGINT NOT NULL DEFAULT 0,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(customer_id)
);

-- Biography chapters (generated output)
CREATE TABLE IF NOT EXISTS biography_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    transcript_source TEXT, -- original transcript
    tokens_used INTEGER NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' -- draft, reviewed, published
);
CREATE INDEX IF NOT EXISTS idx_biography_chapters_customer ON biography_chapters(customer_id, chapter_number);

-- AI intent classification log
CREATE TABLE IF NOT EXISTS ai_intent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    classified_intent TEXT NOT NULL, -- 'general_inquiry', 'booking_help', 'emergency_safety', 'dispute', 'biography'
    confidence DECIMAL(4,3),
    handed_off BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intent_log_user ON ai_intent_log(user_id, created_at DESC);


-- Migration: 0010_service-tracking-safety-ranking.sql
-- Migration 0010: Service Tracking, Safety, Provider Ranking, Government Agencies
-- SilverConnect Global — Non-Profit Elder Care Platform

-- ═══ 1. SERVICE PHOTO EVIDENCE (Before/After) ═══════════════
CREATE TABLE IF NOT EXISTS service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  photo_type VARCHAR(10) NOT NULL CHECK (photo_type IN ('before', 'after')),
  photo_url TEXT NOT NULL,
  caption TEXT,
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by_customer BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ
);
CREATE INDEX idx_service_photos_booking ON service_photos(booking_id);

-- ═══ 2. SAFETY CHECK-IN/CHECK-OUT ════════════════════════════
CREATE TABLE IF NOT EXISTS safety_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  checkin_type VARCHAR(10) NOT NULL CHECK (checkin_type IN ('arrival', 'departure')),
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_confirmed BOOLEAN DEFAULT FALSE,
  duress_flag BOOLEAN DEFAULT FALSE,
  notes TEXT
);
CREATE INDEX idx_safety_checkins_booking ON safety_checkins(booking_id);

-- ═══ 3. PROVIDER SECURITY VERIFICATION ═══════════════════════
CREATE TABLE IF NOT EXISTS provider_security_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  check_type VARCHAR(30) NOT NULL CHECK (check_type IN (
    'police_check', 'wwc', 'ndis_worker_screening',
    'first_aid', 'identity_100pt', 'right_to_work',
    'professional_registration', 'insurance'
  )),
  document_url TEXT,
  issuing_authority TEXT,
  certificate_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired','rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_security_checks_provider ON provider_security_checks(provider_id);
CREATE INDEX idx_security_checks_expiry ON provider_security_checks(expiry_date) WHERE status = 'verified';

-- ═══ 4. PROVIDER FEEDBACK & RANKING ══════════════════════════
CREATE TABLE IF NOT EXISTS service_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
  comment TEXT,
  photo_evidence_score INTEGER DEFAULT 0 CHECK (photo_evidence_score BETWEEN 0 AND 5),
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, customer_id)
);

CREATE TABLE IF NOT EXISTS provider_rankings (
  provider_id UUID PRIMARY KEY,
  postcode VARCHAR(10) NOT NULL,
  composite_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  punctuality_avg DECIMAL(3,2) DEFAULT 0,
  quality_avg DECIMAL(3,2) DEFAULT 0,
  communication_avg DECIMAL(3,2) DEFAULT 0,
  safety_avg DECIMAL(3,2) DEFAULT 0,
  photo_compliance_pct DECIMAL(5,2) DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  emergency_response_rate DECIMAL(5,2) DEFAULT 0,
  rank_in_postcode INTEGER,
  tier VARCHAR(10) DEFAULT 'standard' CHECK (tier IN ('bronze','silver','gold','platinum')),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_provider_rankings_postcode ON provider_rankings(postcode, composite_score DESC);

-- ═══ 5. SMART PRICING (time-of-day, affordability, govt rates) ═══
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(5) NOT NULL,
  rule_name TEXT NOT NULL,
  day_type VARCHAR(20) NOT NULL CHECK (day_type IN ('weekday','saturday','sunday','public_holiday')),
  time_bracket VARCHAR(20) NOT NULL CHECK (time_bracket IN ('standard','early_morning','evening','overnight')),
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  provider_floor_rate DECIMAL(8,2),
  platform_fee_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affordability_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  funding_source VARCHAR(30) NOT NULL CHECK (funding_source IN (
    'self_funded','ndis','tac','worksafe','dva','home_care_package','chsp','other_govt'
  )),
  plan_number TEXT,
  max_hourly_rate DECIMAL(8,2),
  weekly_budget DECIMAL(10,2),
  monthly_budget DECIMAL(10,2),
  remaining_budget DECIMAL(10,2),
  plan_start_date DATE,
  plan_end_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_affordability_customer ON affordability_caps(customer_id);

-- ═══ 6. GOVERNMENT AGENCY INTEGRATION ════════════════════════
CREATE TABLE IF NOT EXISTS govt_agency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency VARCHAR(30) NOT NULL CHECK (agency IN ('ndis','tac','worksafe','dva','chsp','home_care_package')),
  service_tier VARCHAR(20) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  day_type VARCHAR(20) NOT NULL,
  time_bracket VARCHAR(20) NOT NULL,
  max_rate DECIMAL(8,2) NOT NULL,
  provider_min_rate DECIMAL(8,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT
);
CREATE INDEX idx_govt_rates_lookup ON govt_agency_rates(agency, service_tier, day_type, time_bracket);

-- ═══ 7. CANCELLATION POLICY ══════════════════════════════════
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(5) NOT NULL,
  notice_hours INTEGER NOT NULL,
  refund_pct DECIMAL(5,2) NOT NULL,
  provider_compensation_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  description TEXT,
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all','govt_funded','self_funded'))
);

-- Seed AU cancellation policy (NDIS-aligned)
INSERT INTO cancellation_policies (country, notice_hours, refund_pct, provider_compensation_pct, description, applies_to) VALUES
  ('AU', 168, 100.00, 0, '7+ days notice: full refund, no provider fee', 'all'),
  ('AU', 48, 100.00, 0, '48h-7d notice: full refund, no provider fee', 'all'),
  ('AU', 24, 50.00, 50.00, '24-48h notice: 50% refund, provider gets 50% of booking value', 'all'),
  ('AU', 0, 0.00, 90.00, 'Under 24h / no-show: no refund, provider gets 90%', 'all'),
  ('CN', 48, 100.00, 0, '48h+ notice: full refund', 'all'),
  ('CN', 24, 50.00, 50.00, '24-48h notice: 50% refund', 'all'),
  ('CN', 0, 0.00, 80.00, 'Under 24h: no refund', 'all'),
  ('CA', 48, 100.00, 0, '48h+ notice: full refund', 'all'),
  ('CA', 24, 50.00, 50.00, '24-48h notice: 50% refund', 'all'),
  ('CA', 0, 0.00, 90.00, 'Under 24h: no refund', 'all');

-- Seed AU pricing rules (NDIS Price Guide 2025-26 aligned)
INSERT INTO pricing_rules (country, rule_name, day_type, time_bracket, multiplier, provider_floor_rate, platform_fee_pct) VALUES
  ('AU', 'Weekday Standard', 'weekday', 'standard', 1.00, 38.00, 15.00),
  ('AU', 'Weekday Evening (after 8pm)', 'weekday', 'evening', 1.15, 43.70, 15.00),
  ('AU', 'Saturday', 'saturday', 'standard', 1.50, 57.00, 12.00),
  ('AU', 'Sunday', 'sunday', 'standard', 2.00, 76.00, 12.00),
  ('AU', 'Public Holiday', 'public_holiday', 'standard', 2.50, 95.00, 10.00),
  ('AU', 'Weekday Early (before 7am)', 'weekday', 'early_morning', 1.20, 45.60, 15.00),
  ('AU', 'Overnight', 'weekday', 'overnight', 1.25, 47.50, 12.00);

-- Seed government agency rate caps (NDIS 2025-26 aligned)
INSERT INTO govt_agency_rates (agency, service_tier, service_type, day_type, time_bracket, max_rate, provider_min_rate, effective_from) VALUES
  ('ndis', 'basic', 'personal_care', 'weekday', 'standard', 67.56, 38.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'saturday', 'standard', 94.62, 57.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'sunday', 'standard', 121.67, 76.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'public_holiday', 'standard', 148.73, 95.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'weekday', 'evening', 74.48, 43.70, '2025-07-01'),
  ('ndis', 'certified', 'community_nursing', 'weekday', 'standard', 100.14, 55.00, '2025-07-01'),
  ('ndis', 'clinical', 'clinical_care', 'weekday', 'standard', 134.52, 75.00, '2025-07-01'),
  ('tac', 'basic', 'attendant_care', 'weekday', 'standard', 72.00, 40.00, '2025-07-01'),
  ('tac', 'basic', 'attendant_care', 'saturday', 'standard', 100.80, 60.00, '2025-07-01'),
  ('tac', 'basic', 'attendant_care', 'sunday', 'standard', 129.60, 76.00, '2025-07-01'),
  ('worksafe', 'basic', 'personal_care', 'weekday', 'standard', 69.50, 39.00, '2025-07-01'),
  ('worksafe', 'basic', 'personal_care', 'saturday', 'standard', 97.30, 58.00, '2025-07-01'),
  ('worksafe', 'certified', 'nursing', 'weekday', 'standard', 105.00, 60.00, '2025-07-01');


-- Migration: 0011_seed-catalog-and-fix.sql
-- Migration 0011: Seed service catalog and fix schema
-- Seeds 6 categories, 48 services with multi-country pricing

INSERT INTO service_categories (slug, name_en, name_zh, icon, sort_order) VALUES
('domestic', 'Domestic & Cleaning', '家政清洁', '🧹', 1),
('garden', 'Garden & Outdoor', '花园户外', '🌳', 2),
('repair', 'Repairs & Maintenance', '维修保养', '🔧', 3),
('personal', 'Personal Care', '个人护理', '💊', 4),
('companion', 'Companionship', '陪伴服务', '👋', 5),
('transport', 'Transport & Errands', '交通出行', '🚗', 6)
ON CONFLICT (slug) DO NOTHING;


-- Migration: 0012_same-day-booking-changes.sql
-- Migration 0012: Same-day booking changes
CREATE TABLE IF NOT EXISTS booking_change_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('reschedule', 'provider_swap', 'service_change', 'address_change')),
  reason TEXT,
  penalty_amount DECIMAL(10,2) DEFAULT 0,
  admin_fee DECIMAL(10,2) DEFAULT 0,
  surge_premium DECIMAL(10,2) DEFAULT 0,
  repeat_surcharge DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS provider_incentive_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id TEXT NOT NULL REFERENCES users(id),
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  change_request_id TEXT REFERENCES booking_change_requests(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  tier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_change_requests_booking ON booking_change_requests(booking_id);
CREATE INDEX idx_incentive_provider ON provider_incentive_ledger(provider_id);


-- Migration: 0013_feedback-evidence-disputes.sql
-- Migration 0013: Feedback evidence and disputes
CREATE TABLE IF NOT EXISTS feedback_evidence (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feedback_id TEXT NOT NULL REFERENCES service_feedback(id),
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'voice', 'screenshot', 'text')),
  url TEXT,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feedback_id TEXT NOT NULL REFERENCES service_feedback(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  counter_evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'upheld', 'dismissed', 'removed')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX idx_evidence_feedback ON feedback_evidence(feedback_id);
CREATE INDEX idx_disputes_feedback ON feedback_disputes(feedback_id);
CREATE INDEX idx_disputes_provider ON feedback_disputes(provider_id);


-- Migration: 0014_b2b-provider-management.sql
-- Migration 0014: B2B Provider Management tables
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agency', 'facility', 'community')),
  abn TEXT,
  ndis_registration_number TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  country TEXT NOT NULL DEFAULT 'AU',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('org_admin', 'roster_manager', 'finance_officer', 'team_lead', 'carer')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roster_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  booking_id TEXT REFERENCES bookings(id),
  client_id TEXT NOT NULL REFERENCES users(id),
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funding_claims (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  participant_number TEXT NOT NULL,
  support_item_number TEXT NOT NULL,
  service_date DATE NOT NULL,
  quantity DECIMAL(6,2) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  evidence_type TEXT CHECK (evidence_type IN ('gps_checkin', 'client_confirm', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'submitted', 'accepted', 'rejected', 'paid')),
  batch_reference TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_batches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  batch_reference TEXT NOT NULL UNIQUE,
  total_claims INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  accepted INTEGER DEFAULT 0,
  rejected INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'partially_accepted', 'accepted', 'rejected')),
  submitted_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  period TEXT NOT NULL,
  utilization_rate DECIMAL(5,4),
  booked_hours DECIMAL(8,2),
  available_hours DECIMAL(8,2),
  compliance_rate DECIMAL(5,4),
  revenue DECIMAL(12,2),
  costs DECIMAL(12,2),
  avg_rating DECIMAL(3,2),
  punctuality_rate DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_memberships_org ON org_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_roster_org_date ON roster_entries(organization_id, service_date);
CREATE INDEX idx_roster_provider ON roster_entries(provider_id, service_date);
CREATE INDEX idx_claims_org ON funding_claims(organization_id);
CREATE INDEX idx_claims_status ON funding_claims(status);
CREATE INDEX idx_claims_batch ON funding_claims(batch_reference);
CREATE INDEX idx_snapshots_org ON workforce_snapshots(organization_id, period);
