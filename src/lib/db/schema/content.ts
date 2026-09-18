import { sql } from "drizzle-orm";
import { boolean, check, customType, index, integer, jsonb, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { baseColumns, hasRole, sameTenant } from "./_shared";
import { spaces } from "./community";
import { commentStatus, postStatus, postType, reactionKind, reactionTarget } from "./enums";
import { profiles } from "./identity";
import { universities } from "./tenancy";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * One table for every notice on the board. `type` picks the Zod schema that validates `payload`
 * (src/lib/posts/types.ts); `body` is plain text with link detection, never HTML or Markdown.
 * Counters and identity columns are maintained by triggers in app.protect_post(); clients cannot set them.
 */
export const posts = pgTable(
  "posts",
  {
    ...baseColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id").references(() => spaces.id, { onDelete: "set null" }),
    /** Points at profiles so the API can embed the author; null after account deletion (anonymised). */
    authorId: uuid("author_id").references(() => profiles.userId, { onDelete: "set null" }),
    type: postType("type").notNull(),
    status: postStatus("status").notNull().default("active"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    /** Storage object paths in the post-images bucket, in display order. */
    images: jsonb("images").notNull().default(sql`'[]'::jsonb`),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    acceptedCommentId: uuid("accepted_comment_id"),
    commentCount: integer("comment_count").notNull().default(0),
    thanksCount: integer("thanks_count").notNull().default(0),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    search: tsvector("search").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body, '')), 'B')`,
    ),
  },
  (t) => [
    index("posts_feed_idx").on(t.universityId, t.status, t.createdAt.desc()),
    index("posts_space_idx").on(t.spaceId, t.createdAt.desc()),
    index("posts_type_idx").on(t.universityId, t.type, t.createdAt.desc()),
    index("posts_author_idx").on(t.authorId),
    index("posts_expiry_idx").on(t.expiresAt),
    index("posts_search_idx").using("gin", t.search),
    check("posts_title_length", sql`char_length(title) between 1 and 200`),
    check("posts_body_length", sql`char_length(body) <= 10000`),
    pgPolicy("posts_member_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.status} in ('active', 'resolved', 'expired') or ${t.authorId} = auth.uid() or ${hasRole("moderator")}) and not app.is_blocked_either_way(${t.authorId})`,
    }),
    pgPolicy("posts_member_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.authorId} = auth.uid() and app.can_post()`,
    }),
    pgPolicy("posts_owner_or_moderator_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.authorId} = auth.uid() or ${hasRole("moderator")})`,
      withCheck: sql`${sameTenant(t.universityId)} and (${t.authorId} = auth.uid() or ${hasRole("moderator")})`,
    }),
  ],
);

/** Answers and comments. `is_accepted` is set only through public.accept_answer(). */
export const comments = pgTable(
  "comments",
  {
    ...baseColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    /** Points at profiles so the API can embed the author; null after account deletion (anonymised). */
    authorId: uuid("author_id").references(() => profiles.userId, { onDelete: "set null" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    status: commentStatus("status").notNull().default("active"),
    thanksCount: integer("thanks_count").notNull().default(0),
    isAccepted: boolean("is_accepted").notNull().default(false),
  },
  (t) => [
    index("comments_post_idx").on(t.postId, t.createdAt),
    index("comments_author_idx").on(t.authorId),
    check("comments_body_length", sql`char_length(body) between 1 and 5000`),
    pgPolicy("comments_member_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.status} = 'active' or ${t.authorId} = auth.uid() or ${hasRole("moderator")}) and not app.is_blocked_either_way(${t.authorId})`,
    }),
    pgPolicy("comments_member_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.authorId} = auth.uid() and app.can_post()`,
    }),
    pgPolicy("comments_owner_or_moderator_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.authorId} = auth.uid() or ${hasRole("moderator")})`,
      withCheck: sql`${sameTenant(t.universityId)} and (${t.authorId} = auth.uid() or ${hasRole("moderator")})`,
    }),
  ],
);

/** Thank-you reactions: one per person per target. Counters roll up by trigger. */
export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    targetType: reactionTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    kind: reactionKind("kind").notNull().default("thanks"),
  },
  (t) => [
    uniqueIndex("reactions_unique_idx").on(t.userId, t.targetType, t.targetId, t.kind),
    index("reactions_target_idx").on(t.targetType, t.targetId),
    pgPolicy("reactions_member_select", { for: "select", to: authenticatedRole, using: sameTenant(t.universityId) }),
    pgPolicy("reactions_self_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.userId} = auth.uid() and app.is_active_member()`,
    }),
    pgPolicy("reactions_self_delete", { for: "delete", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${t.userId} = auth.uid()` }),
  ],
);
