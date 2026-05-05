ALTER TABLE "review_reports" ALTER COLUMN "reporter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "raised_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_actions" ALTER COLUMN "admin_id" DROP NOT NULL;