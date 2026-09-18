import { sql } from "drizzle-orm";
import { boolean, index, integer, pgPolicy, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { baseColumns, hasRole, isOwner, sameTenant } from "./_shared";
import { spaceKind, spaceRole } from "./enums";
import { universities } from "./tenancy";

/**
 * Spaces are open groups inside one campus (a residence hall, a course, a club). Every campus member
 * can read every space; joining is a follow that filters the feed and tags posts.
 */
export const spaces = pgTable(
  "spaces",
  {
    ...baseColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    kind: spaceKind("kind").notNull().default("interest"),
    createdBy: uuid("created_by"),
    /** Seeded campus-wide spaces cannot be removed by members. */
    isDefault: boolean("is_default").notNull().default(false),
    memberCount: integer("member_count").notNull().default(0),
  },
  (t) => [
    uniqueIndex("spaces_university_slug_idx").on(t.universityId, t.slug),
    pgPolicy("spaces_member_select", { for: "select", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${t.deletedAt} is null` }),
    pgPolicy("spaces_member_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${t.createdBy} = auth.uid() and app.can_post()`,
    }),
    pgPolicy("spaces_organizer_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (app.is_space_organizer(${t.id}) or ${hasRole("moderator")})`,
      withCheck: sql`${sameTenant(t.universityId)} and (app.is_space_organizer(${t.id}) or ${hasRole("moderator")})`,
    }),
  ],
);

export const spaceMemberships = pgTable(
  "space_memberships",
  {
    ...baseColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id").notNull().references(() => spaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: spaceRole("role").notNull().default("member"),
  },
  (t) => [
    uniqueIndex("space_memberships_space_user_idx").on(t.spaceId, t.userId),
    index("space_memberships_user_idx").on(t.userId),
    pgPolicy("space_memberships_member_select", { for: "select", to: authenticatedRole, using: sameTenant(t.universityId) }),
    pgPolicy("space_memberships_self_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${sameTenant(t.universityId)} and ${isOwner(t.userId)} and app.is_active_member()`,
    }),
    pgPolicy("space_memberships_self_delete", { for: "delete", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${isOwner(t.userId)}` }),
  ],
);
