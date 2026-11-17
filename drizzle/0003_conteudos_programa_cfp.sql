ALTER TABLE "level_content" RENAME COLUMN "intro_period" TO "period";--> statement-breakpoint
ALTER TABLE "level_content" ALTER COLUMN "number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "level_content" ADD COLUMN "exercise_codes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "level_content_level_number_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "level_content_level_idx" ON "level_content" USING btree ("level_code");
