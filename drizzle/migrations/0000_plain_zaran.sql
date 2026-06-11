CREATE TYPE "public"."badge_kind" AS ENUM('verified', 'top_rated', 'fast_responder', 'five_year', 'first_aid_certified');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('AU', 'CN', 'CA');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('police_check', 'first_aid', 'insurance', 'identity', 'wwc');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'zh');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('pending', 'docs_review', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'provider', 'admin');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('cleaning', 'cooking', 'garden', 'personalCare', 'repair');--> statement-breakpoint
CREATE TYPE "public"."time_slot" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('email_verify', 'password_reset');--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "provider_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"slot" time_slot NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"kind" "badge_kind" NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "provider_blocked_times" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_categories" (
	"provider_id" uuid NOT NULL,
	"category" "service_category" NOT NULL,
	CONSTRAINT "provider_categories_provider_id_category_pk" PRIMARY KEY("provider_id","category")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_badges" ADD CONSTRAINT "provider_badges_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_blocked_times" ADD CONSTRAINT "provider_blocked_times_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "verification_codes_email_idx" ON "verification_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_codes_expires_idx" ON "verification_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "emergency_contacts_user_idx" ON "emergency_contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_members_user_idx" ON "family_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_methods_user_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_availability_provider_day_slot_uq" ON "provider_availability" USING btree ("provider_id","day_of_week","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_badges_provider_kind_uq" ON "provider_badges" USING btree ("provider_id","kind");--> statement-breakpoint
CREATE INDEX "provider_blocked_times_provider_start_idx" ON "provider_blocked_times" USING btree ("provider_id","starts_at");--> statement-breakpoint
CREATE INDEX "provider_categories_category_idx" ON "provider_categories" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_documents_provider_type_uq" ON "provider_documents" USING btree ("provider_id","type");--> statement-breakpoint
CREATE INDEX "provider_documents_provider_idx" ON "provider_documents" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_profiles_user_uq" ON "provider_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_profiles_status_idx" ON "provider_profiles" USING btree ("onboarding_status");