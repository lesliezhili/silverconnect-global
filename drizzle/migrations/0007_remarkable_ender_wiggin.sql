CREATE TYPE "public"."background_check_status" AS ENUM('not_started', 'pending', 'cleared', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "compliance_expiry_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"alerted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor" text NOT NULL,
	"vendor_event_id" text,
	"external_ref" text,
	"payload" jsonb,
	"status" text DEFAULT 'received' NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "provider_background_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"vendor" text NOT NULL,
	"external_ref" text,
	"status" "background_check_status" DEFAULT 'not_started' NOT NULL,
	"requested_at" timestamp with time zone,
	"cleared_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"raw_payload" jsonb,
	"last_error" text,
	"is_current" boolean DEFAULT true NOT NULL,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "abn" text;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "business_name" text;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "abn_active" boolean;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "abn_validated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "bg_check_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "bg_check_consent_version" text;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "bg_check_consent_ip" text;--> statement-breakpoint
ALTER TABLE "provider_background_checks" ADD CONSTRAINT "provider_background_checks_provider_id_provider_profiles_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "compliance_expiry_alerts_subject_expiry_uq" ON "compliance_expiry_alerts" USING btree ("subject_type","subject_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "compliance_webhook_events_vendor_event_uq" ON "compliance_webhook_events" USING btree ("vendor","vendor_event_id") WHERE "compliance_webhook_events"."vendor_event_id" is not null;--> statement-breakpoint
CREATE INDEX "compliance_webhook_events_status_idx" ON "compliance_webhook_events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_background_checks_current_uq" ON "provider_background_checks" USING btree ("provider_id") WHERE "provider_background_checks"."is_current";--> statement-breakpoint
CREATE UNIQUE INDEX "provider_background_checks_vendor_ref_uq" ON "provider_background_checks" USING btree ("vendor","external_ref") WHERE "provider_background_checks"."external_ref" is not null;--> statement-breakpoint
CREATE INDEX "provider_background_checks_provider_idx" ON "provider_background_checks" USING btree ("provider_id");