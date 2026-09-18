import { sql } from "drizzle-orm";
import { check, index, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { hasRole, sameTenant } from "./_shared";
import { notificationKind } from "./enums";
import { profiles } from "./identity";
import { universities } from "./tenancy";

const socialColumns = {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * Block is instant, silent, and total (docs/pilot/illinois-tech.md §4): app.is_blocked_either_way()
 * hides both people from each other in every policy. Moderators can see blocks for pattern detection.
 */
export const blocks = pgTable(
  "blocks",
  {
    ...socialColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    blockerId: uuid("blocker_id").notNull(),
    blockedId: uuid("blocked_id").notNull(),
    reason: text("reason"),
  },
  (t) => [
    uniqueIndex("blocks_pair_idx").on(t.blockerId, t.blockedId),
    index("blocks_blocked_idx").on(t.blockedId, t.createdAt),
    check("blocks_not_self", sql`blocker_id <> blocked_id`),
    pgPolicy("blocks_self_or_moderator_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.blockerId} = auth.uid() or ${hasRole("moderator")})`,
    }),
    pgPolicy("blocks_self_insert", { for: "insert", to: authenticatedRole, withCheck: sql`${sameTenant(t.universityId)} and ${t.blockerId} = auth.uid()` }),
    pgPolicy("blocks_self_delete", { for: "delete", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${t.blockerId} = auth.uid()` }),
  ],
);

/** Mute hides someone's posts from you without blocking contact. Private to the muter. */
export const mutes = pgTable(
  "mutes",
  {
    ...socialColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    muterId: uuid("muter_id").notNull(),
    mutedId: uuid("muted_id").notNull(),
  },
  (t) => [
    uniqueIndex("mutes_pair_idx").on(t.muterId, t.mutedId),
    check("mutes_not_self", sql`muter_id <> muted_id`),
    pgPolicy("mutes_self_select", { for: "select", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${t.muterId} = auth.uid()` }),
    pgPolicy("mutes_self_insert", { for: "insert", to: authenticatedRole, withCheck: sql`${sameTenant(t.universityId)} and ${t.muterId} = auth.uid()` }),
    pgPolicy("mutes_self_delete", { for: "delete", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${t.muterId} = auth.uid()` }),
  ],
);

/**
 * In-app inbox. Rows are written only by SECURITY DEFINER functions (app.notify) so nobody can forge
 * a notification; the owner may only mark rows read (enforced by app.protect_notification()).
 */
export const notifications = pgTable(
  "notifications",
  {
    ...socialColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    kind: notificationKind("kind").notNull(),
    actorId: uuid("actor_id").references(() => profiles.userId, { onDelete: "set null" }),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    index("notifications_inbox_idx").on(t.userId, t.readAt, t.createdAt.desc()),
    pgPolicy("notifications_self_select", { for: "select", to: authenticatedRole, using: sql`${t.userId} = auth.uid()` }),
    pgPolicy("notifications_self_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.userId} = auth.uid()`,
      withCheck: sql`${t.userId} = auth.uid()`,
    }),
    pgPolicy("notifications_self_delete", { for: "delete", to: authenticatedRole, using: sql`${t.userId} = auth.uid()` }),
  ],
);
