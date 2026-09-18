CREATE TYPE "public"."comment_status" AS ENUM('active', 'removed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('answer', 'comment', 'accepted', 'thanks', 'relay', 'moderation', 'system', 'digest');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('active', 'resolved', 'expired', 'removed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('question', 'notice', 'event', 'listing', 'meal', 'lost', 'found', 'ride', 'study', 'roommate', 'poll');--> statement-breakpoint
CREATE TYPE "public"."reaction_kind" AS ENUM('thanks');--> statement-breakpoint
CREATE TYPE "public"."reaction_target" AS ENUM('post', 'comment');--> statement-breakpoint
CREATE TYPE "public"."space_kind" AS ENUM('general', 'course', 'residence', 'club', 'interest');--> statement-breakpoint
CREATE TYPE "public"."space_role" AS ENUM('member', 'organizer');--> statement-breakpoint
CREATE TABLE "space_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "space_role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "space_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"kind" "space_kind" DEFAULT 'interest' NOT NULL,
	"created_by" uuid,
	"is_default" boolean DEFAULT false NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid,
	"parent_id" uuid,
	"body" text NOT NULL,
	"status" "comment_status" DEFAULT 'active' NOT NULL,
	"thanks_count" integer DEFAULT 0 NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "comments_body_length" CHECK (char_length(body) between 1 and 5000)
);
--> statement-breakpoint
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid NOT NULL,
	"space_id" uuid,
	"author_id" uuid,
	"type" "post_type" NOT NULL,
	"status" "post_status" DEFAULT 'active' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"accepted_comment_id" uuid,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"thanks_count" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body, '')), 'B')) STORED,
	CONSTRAINT "posts_title_length" CHECK (char_length(title) between 1 and 200),
	CONSTRAINT "posts_body_length" CHECK (char_length(body) <= 10000)
);
--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" "reaction_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"kind" "reaction_kind" DEFAULT 'thanks' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"reason" text,
	CONSTRAINT "blocks_not_self" CHECK (blocker_id <> blocked_id)
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"muter_id" uuid NOT NULL,
	"muted_id" uuid NOT NULL,
	CONSTRAINT "mutes_not_self" CHECK (muter_id <> muted_id)
);
--> statement-breakpoint
ALTER TABLE "mutes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"actor_id" uuid,
	"target_type" text,
	"target_id" uuid,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "digest_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"recipients" integer DEFAULT 0 NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "digest_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid,
	"kind" text NOT NULL,
	"recipient_hash" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"provider" text DEFAULT 'none' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_sends" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rate_limit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rate_limit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email_digest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "space_memberships" ADD CONSTRAINT "space_memberships_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_memberships" ADD CONSTRAINT "space_memberships_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_profiles_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutes" ADD CONSTRAINT "mutes_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_profiles_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "space_memberships_space_user_idx" ON "space_memberships" USING btree ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "space_memberships_user_idx" ON "space_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "spaces_university_slug_idx" ON "spaces" USING btree ("university_id","slug");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_feed_idx" ON "posts" USING btree ("university_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_space_idx" ON "posts" USING btree ("space_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_type_idx" ON "posts" USING btree ("university_id","type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_expiry_idx" ON "posts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "posts_search_idx" ON "posts" USING gin ("search");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_unique_idx" ON "reactions" USING btree ("user_id","target_type","target_id","kind");--> statement-breakpoint
CREATE INDEX "reactions_target_idx" ON "reactions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_pair_idx" ON "blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE INDEX "blocks_blocked_idx" ON "blocks" USING btree ("blocked_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mutes_pair_idx" ON "mutes" USING btree ("muter_id","muted_id");--> statement-breakpoint
CREATE INDEX "notifications_inbox_idx" ON "notifications" USING btree ("user_id","read_at","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "digest_runs_university_idx" ON "digest_runs" USING btree ("university_id","created_at");--> statement-breakpoint
CREATE INDEX "email_sends_created_idx" ON "email_sends" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rate_limit_events_lookup_idx" ON "rate_limit_events" USING btree ("user_id","action","created_at");--> statement-breakpoint
CREATE POLICY "space_memberships_member_select" ON "space_memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("space_memberships"."university_id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "space_memberships_self_insert" ON "space_memberships" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("space_memberships"."university_id" = app.current_university_id() and "space_memberships"."user_id" = auth.uid() and app.is_active_member());--> statement-breakpoint
CREATE POLICY "space_memberships_self_delete" ON "space_memberships" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("space_memberships"."university_id" = app.current_university_id() and "space_memberships"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "spaces_member_select" ON "spaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("spaces"."university_id" = app.current_university_id() and "spaces"."deleted_at" is null);--> statement-breakpoint
CREATE POLICY "spaces_member_insert" ON "spaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("spaces"."university_id" = app.current_university_id() and "spaces"."created_by" = auth.uid() and app.can_post());--> statement-breakpoint
CREATE POLICY "spaces_organizer_update" ON "spaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("spaces"."university_id" = app.current_university_id() and (app.is_space_organizer("spaces"."id") or app.has_role('moderator'))) WITH CHECK ("spaces"."university_id" = app.current_university_id() and (app.is_space_organizer("spaces"."id") or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "comments_member_select" ON "comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("comments"."university_id" = app.current_university_id() and ("comments"."status" = 'active' or "comments"."author_id" = auth.uid() or app.has_role('moderator')) and not app.is_blocked_either_way("comments"."author_id"));--> statement-breakpoint
CREATE POLICY "comments_member_insert" ON "comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("comments"."university_id" = app.current_university_id() and "comments"."author_id" = auth.uid() and app.can_post());--> statement-breakpoint
CREATE POLICY "comments_owner_or_moderator_update" ON "comments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("comments"."university_id" = app.current_university_id() and ("comments"."author_id" = auth.uid() or app.has_role('moderator'))) WITH CHECK ("comments"."university_id" = app.current_university_id() and ("comments"."author_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "posts_member_select" ON "posts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("posts"."university_id" = app.current_university_id() and ("posts"."status" in ('active', 'resolved', 'expired') or "posts"."author_id" = auth.uid() or app.has_role('moderator')) and not app.is_blocked_either_way("posts"."author_id"));--> statement-breakpoint
CREATE POLICY "posts_member_insert" ON "posts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("posts"."university_id" = app.current_university_id() and "posts"."author_id" = auth.uid() and app.can_post());--> statement-breakpoint
CREATE POLICY "posts_owner_or_moderator_update" ON "posts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("posts"."university_id" = app.current_university_id() and ("posts"."author_id" = auth.uid() or app.has_role('moderator'))) WITH CHECK ("posts"."university_id" = app.current_university_id() and ("posts"."author_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "reactions_member_select" ON "reactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("reactions"."university_id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "reactions_self_insert" ON "reactions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reactions"."university_id" = app.current_university_id() and "reactions"."user_id" = auth.uid() and app.is_active_member());--> statement-breakpoint
CREATE POLICY "reactions_self_delete" ON "reactions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("reactions"."university_id" = app.current_university_id() and "reactions"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "blocks_self_or_moderator_select" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("blocks"."university_id" = app.current_university_id() and ("blocks"."blocker_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "blocks_self_insert" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("blocks"."university_id" = app.current_university_id() and "blocks"."blocker_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "blocks_self_delete" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("blocks"."university_id" = app.current_university_id() and "blocks"."blocker_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "mutes_self_select" ON "mutes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("mutes"."university_id" = app.current_university_id() and "mutes"."muter_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "mutes_self_insert" ON "mutes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("mutes"."university_id" = app.current_university_id() and "mutes"."muter_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "mutes_self_delete" ON "mutes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("mutes"."university_id" = app.current_university_id() and "mutes"."muter_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "notifications_self_select" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "notifications_self_update" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."user_id" = auth.uid()) WITH CHECK ("notifications"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "notifications_self_delete" ON "notifications" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("notifications"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "digest_runs_admin_select" ON "digest_runs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("digest_runs"."university_id" = app.current_university_id() and app.has_role('university_admin'));