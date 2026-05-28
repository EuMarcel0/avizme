CREATE TYPE "public"."delivery_channel" AS ENUM('sms', 'whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."occurrence_status" AS ENUM('pending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."schedule_type" AS ENUM('single', 'same_day_multi', 'interval', 'interval_multi', 'weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_delivery_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_id" uuid NOT NULL,
	"channel" "delivery_channel" NOT NULL,
	"destination" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_id" uuid NOT NULL,
	"schedule_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"status" "occurrence_status" DEFAULT 'pending' NOT NULL,
	"channel" "delivery_channel",
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_id" uuid NOT NULL,
	"schedule_type" "schedule_type" NOT NULL,
	"start_date" date,
	"end_date" date,
	"interval_days" integer,
	"times" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weekdays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"day_of_month" integer,
	"config" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"status" "reminder_status" DEFAULT 'active' NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminder_delivery_channels" ADD CONSTRAINT "reminder_delivery_channels_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_occurrences" ADD CONSTRAINT "reminder_occurrences_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_occurrences" ADD CONSTRAINT "reminder_occurrences_schedule_id_reminder_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."reminder_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;