CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"options" integer[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poll_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "post_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "participant_kind" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "relay_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"university_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"flagged_words" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "relay_messages_body_length" CHECK (char_length(body) between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "relay_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "relay_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"university_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"initiator_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"state" "relay_state" DEFAULT 'open' NOT NULL,
	"initiator_share_email" boolean DEFAULT false NOT NULL,
	"owner_share_email" boolean DEFAULT false NOT NULL,
	"initiator_confirmed_at" timestamp with time zone,
	"owner_confirmed_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"message_count" integer DEFAULT 0 NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	CONSTRAINT "relay_threads_not_self" CHECK (initiator_id <> owner_id)
);
--> statement-breakpoint
ALTER TABLE "relay_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "audience" "post_audience" DEFAULT 'campus' NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_participants" ADD CONSTRAINT "post_participants_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_participants" ADD CONSTRAINT "post_participants_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_participants" ADD CONSTRAINT "post_participants_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_messages" ADD CONSTRAINT "relay_messages_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_messages" ADD CONSTRAINT "relay_messages_thread_id_relay_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."relay_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_messages" ADD CONSTRAINT "relay_messages_sender_id_profiles_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_threads" ADD CONSTRAINT "relay_threads_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_threads" ADD CONSTRAINT "relay_threads_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_threads" ADD CONSTRAINT "relay_threads_initiator_id_profiles_user_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay_threads" ADD CONSTRAINT "relay_threads_owner_id_profiles_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_post_user_idx" ON "poll_votes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_participants_post_user_idx" ON "post_participants" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "post_participants_user_idx" ON "post_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "relay_messages_thread_idx" ON "relay_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "relay_threads_post_initiator_idx" ON "relay_threads" USING btree ("post_id","initiator_id");--> statement-breakpoint
CREATE INDEX "relay_threads_owner_idx" ON "relay_threads" USING btree ("owner_id","last_message_at");--> statement-breakpoint
CREATE INDEX "relay_threads_initiator_idx" ON "relay_threads" USING btree ("initiator_id","last_message_at");--> statement-breakpoint
CREATE POLICY "poll_votes_self_select" ON "poll_votes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("poll_votes"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "poll_votes_self_insert" ON "poll_votes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("poll_votes"."university_id" = app.current_university_id() and "poll_votes"."user_id" = auth.uid() and app.can_post());--> statement-breakpoint
CREATE POLICY "poll_votes_self_update" ON "poll_votes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("poll_votes"."user_id" = auth.uid()) WITH CHECK ("poll_votes"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "post_participants_member_select" ON "post_participants" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("post_participants"."university_id" = app.current_university_id());--> statement-breakpoint
CREATE POLICY "post_participants_self_insert" ON "post_participants" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("post_participants"."university_id" = app.current_university_id() and "post_participants"."user_id" = auth.uid() and app.can_post());--> statement-breakpoint
CREATE POLICY "post_participants_self_delete" ON "post_participants" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("post_participants"."university_id" = app.current_university_id() and "post_participants"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "relay_messages_participant_select" ON "relay_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("relay_messages"."university_id" = app.current_university_id() and (app.is_thread_participant("relay_messages"."thread_id") or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "relay_messages_participant_insert" ON "relay_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("relay_messages"."university_id" = app.current_university_id() and "relay_messages"."sender_id" = auth.uid() and app.is_thread_participant("relay_messages"."thread_id"));--> statement-breakpoint
CREATE POLICY "relay_threads_participant_select" ON "relay_threads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("relay_threads"."university_id" = app.current_university_id() and ("relay_threads"."initiator_id" = auth.uid() or "relay_threads"."owner_id" = auth.uid() or app.has_role('moderator')));--> statement-breakpoint
CREATE POLICY "relay_threads_initiator_insert" ON "relay_threads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("relay_threads"."university_id" = app.current_university_id() and "relay_threads"."initiator_id" = auth.uid() and app.can_post());--> statement-breakpoint
CREATE POLICY "relay_threads_participant_update" ON "relay_threads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("relay_threads"."university_id" = app.current_university_id() and ("relay_threads"."initiator_id" = auth.uid() or "relay_threads"."owner_id" = auth.uid())) WITH CHECK ("relay_threads"."university_id" = app.current_university_id() and ("relay_threads"."initiator_id" = auth.uid() or "relay_threads"."owner_id" = auth.uid()));--> statement-breakpoint
ALTER POLICY "posts_member_select" ON "posts" TO authenticated USING ("posts"."university_id" = app.current_university_id() and ("posts"."status" in ('active', 'resolved', 'expired') or "posts"."author_id" = auth.uid() or app.has_role('moderator')) and not app.is_blocked_either_way("posts"."author_id") and app.can_see_audience("posts"."audience", "posts"."author_id"));