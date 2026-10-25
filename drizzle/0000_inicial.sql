CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"level_id" text NOT NULL,
	"exercise_ids" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"code" text,
	"description" text,
	"primary_objective" text,
	"content" text,
	"subcategory" text,
	"training_block" text,
	"category" text,
	"style" text[] DEFAULT '{}' NOT NULL,
	"level" text[] DEFAULT '{}' NOT NULL,
	"turmas" text[] DEFAULT '{}' NOT NULL,
	"equipment_required" text[] DEFAULT '{}' NOT NULL,
	"focus_points" text[] DEFAULT '{}' NOT NULL,
	"focus_area" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"instructions" text[] DEFAULT '{}' NOT NULL,
	"variations" text[] DEFAULT '{}' NOT NULL,
	"difficulty_rating" integer,
	"common_mistakes" text,
	"coaching_cues" text,
	"video_url" text,
	"image_diagram" text,
	"demo_3d" text,
	"distance" text,
	"distance_m" integer,
	"rest_interval" text,
	"repetitions" text,
	"duration" text,
	"intensity" text,
	"level_id" text DEFAULT 'ALL' NOT NULL,
	"period_type" text DEFAULT 'FULL_YEAR' NOT NULL,
	"period_label" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_example" boolean DEFAULT false NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "level" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"duration_min" integer,
	"max_students" integer,
	"age_range" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "level_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sheet" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"level_id" text NOT NULL,
	"session_date" date,
	"focus" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_distance" integer,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_summary" ADD CONSTRAINT "class_summary_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sheet" ADD CONSTRAINT "workout_sheet_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "class_summary_date_level_idx" ON "class_summary" USING btree ("date","level_id");--> statement-breakpoint
CREATE INDEX "exercise_level_id_idx" ON "exercise" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX "exercise_order_idx" ON "exercise" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "workout_sheet_date_idx" ON "workout_sheet" USING btree ("session_date");