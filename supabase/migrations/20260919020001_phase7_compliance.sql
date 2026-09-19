CREATE TABLE "deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"purged_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "deletion_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"last_used_at" timestamp with time zone,
	"failed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "deletion_requests_user_idx" ON "deletion_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deletion_requests_due_idx" ON "deletion_requests" USING btree ("scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "deletion_requests_self_select" ON "deletion_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("deletion_requests"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "push_subscriptions_self_all" ON "push_subscriptions" AS PERMISSIVE FOR ALL TO "authenticated" USING ("push_subscriptions"."user_id" = auth.uid()) WITH CHECK ("push_subscriptions"."user_id" = auth.uid());