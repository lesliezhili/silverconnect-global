CREATE TYPE "public"."active_role" AS ENUM('customer', 'provider', 'helper', 'admin');--> statement-breakpoint
CREATE TYPE "public"."supported_language" AS ENUM('en', 'zh', 'zh_tw', 'th', 'ko', 'ja');--> statement-breakpoint
CREATE TABLE "user_representatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"elder_user_id" uuid NOT NULL,
	"representative_user_id" uuid NOT NULL,
	"authorization_doc_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_role_switches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_role" text NOT NULL,
	"to_role" text NOT NULL,
	"switched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_categories" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."service_category";--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('cleaning', 'companion', 'garden', 'personalCare', 'repair');--> statement-breakpoint
ALTER TABLE "provider_categories" ALTER COLUMN "category" SET DATA TYPE "public"."service_category" USING "category"::"public"."service_category";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_active_role" text DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "large_text_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_representatives" ADD CONSTRAINT "user_representatives_elder_user_id_users_id_fk" FOREIGN KEY ("elder_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_representatives" ADD CONSTRAINT "user_representatives_representative_user_id_users_id_fk" FOREIGN KEY ("representative_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_switches" ADD CONSTRAINT "user_role_switches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_representatives_elder" ON "user_representatives" USING btree ("elder_user_id");--> statement-breakpoint
CREATE INDEX "idx_representatives_rep" ON "user_representatives" USING btree ("representative_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_representatives_elder_rep_uq" ON "user_representatives" USING btree ("elder_user_id","representative_user_id");--> statement-breakpoint
CREATE INDEX "idx_role_switches_user" ON "user_role_switches" USING btree ("user_id","switched_at");