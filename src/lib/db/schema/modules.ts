import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { baseColumns, hasRole, sameTenant } from "./_shared";
import { participantKind, relayState } from "./enums";
import { posts } from "./content";
import { profiles } from "./identity";
import { universities } from "./tenancy";

const rowColumns = {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * One table for "I am in": event RSVPs, ride seats, study-group members. The kind follows the post
 * type and capacity comes from the payload; both are enforced by app.before_participant_insert().
 */
export const postParticipants = pgTable(
  "post_participants",
  {
    ...rowColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    kind: participantKind("kind").notNull(),
  },
  (t) => [
    uniqueIndex("post_participants_post_user_idx").on(t.postId, t.userId),
    index("post_participants_user_idx").on(t.userId),
    pgPolicy("post_participants_member_select", { for: "select", to: authenticatedRole, using: sameTenant(t.universityId) }),
    pgPolicy("post_participants_self_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.userId} = auth.uid() and app.can_post()`,
    }),
    pgPolicy("post_participants_self_delete", { for: "delete", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${t.userId} = auth.uid()` }),
  ],
);

/** One vote per verified student per poll; who voted what is private (tallies come from poll_results()). */
export const pollVotes = pgTable(
  "poll_votes",
  {
    ...rowColumns,
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    options: integer("options").array().notNull(),
  },
  (t) => [
    uniqueIndex("poll_votes_post_user_idx").on(t.postId, t.userId),
    pgPolicy("poll_votes_self_select", { for: "select", to: authenticatedRole, using: sql`${t.userId} = auth.uid()` }),
    pgPolicy("poll_votes_self_insert", { for: "insert", to: authenticatedRole, withCheck: sql`${sameTenant(t.universityId)} and ${t.userId} = auth.uid() and app.can_post()` }),
    pgPolicy("poll_votes_self_update", { for: "update", to: authenticatedRole, using: sql`${t.userId} = auth.uid()`, withCheck: sql`${t.userId} = auth.uid()` }),
  ],
);

/**
 * Masked relay (ARCHITECTURE.md §7, pilot §4): a double-blind thread between the person who took a tab
 * and the notice owner. Names and emails appear only when both sides opt in; blocks freeze the thread.
 */
export const relayThreads = pgTable(
  "relay_threads",
  {
    ...baseColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    initiatorId: uuid("initiator_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    state: relayState("state").notNull().default("open"),
    initiatorShareEmail: boolean("initiator_share_email").notNull().default(false),
    ownerShareEmail: boolean("owner_share_email").notNull().default(false),
    /** Meal treats and hand-offs: both tap "it happened"; the owner is credited once both are set. */
    initiatorConfirmedAt: timestamp("initiator_confirmed_at", { withTimezone: true }),
    ownerConfirmedAt: timestamp("owner_confirmed_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    messageCount: integer("message_count").notNull().default(0),
    /** Set when a message tripped the payment-word check; shown as a caution, kept for reports. */
    flagged: boolean("flagged").notNull().default(false),
  },
  (t) => [
    uniqueIndex("relay_threads_post_initiator_idx").on(t.postId, t.initiatorId),
    index("relay_threads_owner_idx").on(t.ownerId, t.lastMessageAt),
    index("relay_threads_initiator_idx").on(t.initiatorId, t.lastMessageAt),
    check("relay_threads_not_self", sql`initiator_id <> owner_id`),
    pgPolicy("relay_threads_participant_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.initiatorId} = auth.uid() or ${t.ownerId} = auth.uid() or ${hasRole("moderator")})`,
    }),
    pgPolicy("relay_threads_initiator_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.initiatorId} = auth.uid() and app.can_post()`,
    }),
    pgPolicy("relay_threads_participant_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.initiatorId} = auth.uid() or ${t.ownerId} = auth.uid())`,
      withCheck: sql`${sameTenant(t.universityId)} and (${t.initiatorId} = auth.uid() or ${t.ownerId} = auth.uid())`,
    }),
  ],
);

export const relayMessages = pgTable(
  "relay_messages",
  {
    ...rowColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull().references(() => relayThreads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    body: text("body").notNull(),
    /** Payment or pressure words found by the server check, for the caution banner and reports. */
    flaggedWords: text("flagged_words").array().notNull().default(sql`'{}'::text[]`),
  },
  (t) => [
    index("relay_messages_thread_idx").on(t.threadId, t.createdAt),
    check("relay_messages_body_length", sql`char_length(body) between 1 and 2000`),
    pgPolicy("relay_messages_participant_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (app.is_thread_participant(${t.threadId}) or ${hasRole("moderator")})`,
    }),
    pgPolicy("relay_messages_participant_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.senderId} = auth.uid() and app.is_thread_participant(${t.threadId})`,
    }),
  ],
);
