ALTER TYPE "public"."ncr_status" ADD VALUE 'VERIFICATION' BEFORE 'APPROVED';--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"global_enabled" boolean DEFAULT true NOT NULL,
	"ncr_created_enabled" boolean DEFAULT true NOT NULL,
	"ncr_assigned_enabled" boolean DEFAULT true NOT NULL,
	"status_change_enabled" boolean DEFAULT true NOT NULL,
	"overdue_enabled" boolean DEFAULT true NOT NULL,
	"verification_required_enabled" boolean DEFAULT true NOT NULL,
	"verification_rejected_enabled" boolean DEFAULT true NOT NULL,
	"ncr_closed_enabled" boolean DEFAULT true NOT NULL,
	"ncr_cancelled_enabled" boolean DEFAULT true NOT NULL,
	"overdue_first_follow_up_days" integer DEFAULT 3 NOT NULL,
	"overdue_recurring_days" integer DEFAULT 7 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ncrs" ADD COLUMN "date_closed" timestamp;