CREATE TABLE "level_content" (
	"id" text PRIMARY KEY NOT NULL,
	"level_code" text NOT NULL,
	"number" text NOT NULL,
	"block" text,
	"title" text NOT NULL,
	"intro_period" text,
	"periods" text[] DEFAULT '{}' NOT NULL,
	"start_month" text,
	"months" text[] DEFAULT '{}' NOT NULL,
	"continuity" text[] DEFAULT '{}' NOT NULL,
	"source" text,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_summary" ADD COLUMN "content_ids" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "level" ADD COLUMN "stage" text;--> statement-breakpoint
ALTER TABLE "level" ADD COLUMN "space" text;--> statement-breakpoint
ALTER TABLE "level" ADD COLUMN "requirements" text;--> statement-breakpoint
ALTER TABLE "level" ADD COLUMN "periods" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "level_content_level_number_idx" ON "level_content" USING btree ("level_code","number");