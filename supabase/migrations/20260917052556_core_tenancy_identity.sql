CREATE TYPE "public"."campus_role" AS ENUM('student', 'staff', 'alumni', 'moderator', 'university_admin');--> statement-breakpoint
CREATE TYPE "public"."domain_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."domain_source" AS ENUM('hipo', 'admin', 'seed');--> statement-breakpoint
CREATE TYPE "public"."identity_provider" AS ENUM('google', 'email', 'saml');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'read_only', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "public"."university_status" AS ENUM('pending', 'active', 'paused');--> statement-breakpoint
CREATE TABLE "domain_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"domain" text NOT NULL,
	"email_hash" text NOT NULL,
	"message" text,
	"status" "domain_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "domain_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"university_id" uuid NOT NULL,
	"campus_role" "campus_role" DEFAULT 'student' NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"last_sign_in_at" timestamp with time zone,
	"verified_term" text,
	"verified_at" timestamp with time zone,
	"sso_provider_id" text,
	"status_reason" text
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"country" text DEFAULT 'US' NOT NULL,
	"timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"status" "university_status" DEFAULT 'pending' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feature_flags" jsonb DEFAULT '{"meals": false}'::jsonb NOT NULL,
	"policy_text" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"safe_exchange_locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dining_locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accent_hue" text DEFAULT '155' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "universities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "university_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"hosted_domain" text,
	"role" "campus_role" DEFAULT 'student' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"source" "domain_source" DEFAULT 'admin' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "university_domains" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"university_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"initials" text NOT NULL,
	"campus_username" text NOT NULL,
	"bio" text,
	"class_year" integer,
	"helped_count" integer DEFAULT 0 NOT NULL,
	"thanks_count" integer DEFAULT 0 NOT NULL,
	"privacy_mode" boolean DEFAULT false NOT NULL,
	"meal_plan_attested_term" text,
	"meal_plan_attested_at" timestamp with time zone,
	"onboarded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"email" text NOT NULL,
	"email_domain" text NOT NULL,
	"campus_username" text NOT NULL,
	"declared_given_name" text,
	"declared_family_name" text,
	"name_locked_at" timestamp with time zone,
	"name_matches_username" boolean DEFAULT false NOT NULL,
	"name_verified_in_person_at" timestamp with time zone,
	"identity_provider" "identity_provider" DEFAULT 'email' NOT NULL,
	"name_pending" boolean DEFAULT true NOT NULL,
	"age_attested_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"policy_version_id" uuid NOT NULL,
	"choice" text NOT NULL,
	"accepted" boolean NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "policy_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"content_path" text NOT NULL,
	"content_hash" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"effective_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "policy_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid,
	"actor_id" uuid,
	"actor_role" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"ip" "inet"
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "university_domains" ADD CONSTRAINT "university_domains_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_policy_version_id_policy_versions_id_fk" FOREIGN KEY ("policy_version_id") REFERENCES "public"."policy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domain_requests_status_idx" ON "domain_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_university_idx" ON "memberships" USING btree ("user_id","university_id");--> statement-breakpoint
CREATE INDEX "memberships_university_role_idx" ON "memberships" USING btree ("university_id","campus_role");--> statement-breakpoint
CREATE UNIQUE INDEX "universities_slug_idx" ON "universities" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "university_domains_domain_idx" ON "university_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "university_domains_university_idx" ON "university_domains" USING btree ("university_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profiles_university_idx" ON "profiles" USING btree ("university_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "consent_records_user_idx" ON "consent_records" USING btree ("user_id","policy_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_versions_slug_version_idx" ON "policy_versions" USING btree ("slug","version","university_id");--> statement-breakpoint
CREATE INDEX "audit_log_university_created_idx" ON "audit_log" USING btree ("university_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE POLICY "memberships_member_select" ON "memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("memberships"."university_id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "memberships_admin_update" ON "memberships" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("memberships"."university_id" = app.current_university_id() and app.has_role('university_admin')) WITH CHECK ("memberships"."university_id" = app.current_university_id() and app.has_role('university_admin'));--> statement-breakpoint
CREATE POLICY "universities_member_select" ON "universities" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("universities"."id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "universities_admin_update" ON "universities" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("universities"."id" = app.current_university_id() and app.has_role('university_admin')) WITH CHECK ("universities"."id" = app.current_university_id() and app.has_role('university_admin'));--> statement-breakpoint
CREATE POLICY "university_domains_member_select" ON "university_domains" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("university_domains"."university_id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "university_domains_admin_write" ON "university_domains" AS PERMISSIVE FOR ALL TO "authenticated" USING ("university_domains"."university_id" = app.current_university_id() and app.has_role('university_admin')) WITH CHECK ("university_domains"."university_id" = app.current_university_id() and app.has_role('university_admin'));--> statement-breakpoint
CREATE POLICY "profiles_member_select" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."university_id" = app.current_university_id() and not app.is_blocked_either_way("profiles"."user_id"));--> statement-breakpoint
CREATE POLICY "profiles_owner_update" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."user_id" = auth.uid() and "profiles"."university_id" = app.current_university_id()) WITH CHECK ("profiles"."user_id" = auth.uid() and "profiles"."university_id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "profiles_moderator_update" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."university_id" = app.current_university_id() and app.has_role('moderator')) WITH CHECK ("profiles"."university_id" = app.current_university_id() and app.has_role('moderator'));--> statement-breakpoint
CREATE POLICY "users_self_select" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("users"."id" = auth.uid());--> statement-breakpoint
CREATE POLICY "consent_records_self_select" ON "consent_records" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("consent_records"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "consent_records_self_insert" ON "consent_records" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("consent_records"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "policy_versions_public_select" ON "policy_versions" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "audit_log_admin_select" ON "audit_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("audit_log"."university_id" = app.current_university_id() and app.has_role('university_admin'));