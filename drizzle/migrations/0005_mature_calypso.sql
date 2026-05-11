CREATE TYPE "public"."donation_mode" AS ENUM('once', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."donation_payment_status" AS ENUM('succeeded', 'partially_refunded', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('pending', 'completed', 'active', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."processed_stripe_event_status" AS ENUM('processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"goal_amount" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"refunded_amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text NOT NULL,
	"status" "donation_payment_status" DEFAULT 'succeeded' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"stripe_charge_id" text,
	"stripe_refund_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"receipt_url" text,
	"billing_reason" text,
	"captured_at" timestamp with time zone NOT NULL,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"mode" "donation_mode" NOT NULL,
	"status" "donation_status" DEFAULT 'pending' NOT NULL,
	"stripe_session_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"donor_phone" text,
	"donor_message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" "processed_stripe_event_status" NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"last_error" text,
	"locked_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "donation_payments" ADD CONSTRAINT "donation_payments_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_payments" ADD CONSTRAINT "donation_payments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_uq" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "donation_payments_pi_uq" ON "donation_payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "donation_payments_invoice_uq" ON "donation_payments" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "donation_payments_donation_idx" ON "donation_payments" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "donation_payments_charge_idx" ON "donation_payments" USING btree ("stripe_charge_id");--> statement-breakpoint
CREATE INDEX "donation_payments_campaign_status_idx" ON "donation_payments" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "donations_stripe_session_uq" ON "donations" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "donations_stripe_subscription_uq" ON "donations" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "donations_campaign_idx" ON "donations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "donations_status_idx" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donations_donor_email_idx" ON "donations" USING btree ("donor_email");