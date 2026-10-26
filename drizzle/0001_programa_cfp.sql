CREATE TABLE "level_content" (
	"id" text PRIMARY KEY NOT NULL,
	"level_code" text NOT NULL,
	"number" text,
	"block" text,
	"title" text NOT NULL,
	"period" text,
	"months" text[] DEFAULT '{}' NOT NULL,
	"exercise_codes" text[] DEFAULT '{}' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_summary" ADD COLUMN "content_ids" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "organization" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "success_criteria" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "progression" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "regression" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "age_adaptation" text;--> statement-breakpoint
CREATE INDEX "level_content_level_idx" ON "level_content" USING btree ("level_code");