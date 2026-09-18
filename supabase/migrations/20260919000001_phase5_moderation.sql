CREATE TABLE "appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"action_id" uuid NOT NULL,
	"appellant_id" uuid NOT NULL,
	"text" text NOT NULL,
	"status" "appeal_status" DEFAULT 'open' NOT NULL,
	"reviewed_by" uuid,
	"decision_reasons" text,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "appeals_text_length" CHECK (char_length(text) between 10 and 4000)
);
--> statement-breakpoint
ALTER TABLE "appeals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid,
	"user_id" uuid,
	"sentiment" "feedback_sentiment" NOT NULL,
	"message" text NOT NULL,
	"page_url" text,
	"user_agent" text,
	"consent" boolean DEFAULT false NOT NULL,
	"forwarded_to" text,
	CONSTRAINT "feedback_message_length" CHECK (char_length(message) between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"report_id" uuid,
	"moderator_id" uuid NOT NULL,
	"subject_id" uuid,
	"target_type" "report_target",
	"target_id" uuid,
	"kind" "moderation_kind" NOT NULL,
	"statement_of_reasons" jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"reversed_at" timestamp with time zone,
	"reversed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "moderation_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"case_number" text NOT NULL,
	"reporter_id" uuid NOT NULL,
	"subject_id" uuid,
	"target_type" "report_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"category" "report_category" NOT NULL,
	"note" text,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp with time zone,
	"escalation_consent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "suspended_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_action_id_moderation_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."moderation_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_subject_id_profiles_user_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_subject_id_profiles_user_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appeals_action_idx" ON "appeals" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "feedback_created_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "moderation_actions_subject_idx" ON "moderation_actions" USING btree ("subject_id","created_at");--> statement-breakpoint
CREATE INDEX "moderation_actions_university_idx" ON "moderation_actions" USING btree ("university_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_case_idx" ON "reports" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "reports_queue_idx" ON "reports" USING btree ("university_id","status","created_at");--> statement-breakpoint
CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_subject_idx" ON "reports" USING btree ("subject_id");--> statement-breakpoint
CREATE POLICY "appeals_appellant_or_moderator_select" ON "appeals" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("appeals"."university_id" = app.current_university_id() and ("appeals"."appellant_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "feedback_insert" ON "feedback" AS PERMISSIVE FOR INSERT TO "anon", "authenticated" WITH CHECK (("feedback"."user_id" is null or "feedback"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "feedback_admin_select" ON "feedback" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("feedback"."university_id" = app.current_university_id() and app.has_role('university_admin'));--> statement-breakpoint
CREATE POLICY "moderation_actions_subject_or_moderator_select" ON "moderation_actions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("moderation_actions"."university_id" = app.current_university_id() and ("moderation_actions"."subject_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "reports_reporter_or_moderator_select" ON "reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("reports"."university_id" = app.current_university_id() and ("reports"."reporter_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "reports_moderator_update" ON "reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("reports"."university_id" = app.current_university_id() and app.has_role('moderator')) WITH CHECK ("reports"."university_id" = app.current_university_id() and app.has_role('moderator'));