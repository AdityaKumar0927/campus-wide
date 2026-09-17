import { sql } from "drizzle-orm";
import { pgPolicy, pgSchema, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

/** Helper functions live in the `app` schema (created in the hand-written functions migration). */
export const app = pgSchema("app");

/** Columns every domain table carries (ARCHITECTURE.md §6). */
export const baseColumns = {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/** `university_id = app.current_university_id()` — the tenant predicate on every policy. */
export const sameTenant = (col: AnyPgColumn) => sql`${col} = app.current_university_id()`;

/** Standard tenant-scoped read policy for authenticated members. */
export const tenantSelect = (name: string, col: AnyPgColumn, extra?: ReturnType<typeof sql>) =>
  pgPolicy(name, {
    for: "select",
    to: authenticatedRole,
    using: extra ? sql`${sameTenant(col)} and (${extra})` : sameTenant(col),
  });

/** Ownership predicate: the row's author is the caller. */
export const isOwner = (col: AnyPgColumn) => sql`${col} = auth.uid()`;

/** Role predicate evaluated against memberships (not the JWT), so demotions apply immediately. */
export const hasRole = (role: string) => sql`app.has_role(${sql.raw(`'${role}'`)})`;
