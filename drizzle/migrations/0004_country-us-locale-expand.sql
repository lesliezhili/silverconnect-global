-- Country enum: rename CN -> US (staging has no real CN data)
ALTER TYPE "public"."country" RENAME VALUE 'CN' TO 'US';
--> statement-breakpoint

-- Locale enum: rename zh -> zh-CN and add the four new locales
ALTER TYPE "public"."locale" RENAME VALUE 'zh' TO 'zh-CN';
--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE IF NOT EXISTS 'zh-TW';
--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE IF NOT EXISTS 'ja';
--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE IF NOT EXISTS 'ko';
