import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { hasRole, sameTenant } from "./_shared";

/**
 * Rate limiting lives in Postgres (D-22): app.check_rate_limit() counts a caller's recent events and
 * raises when a window is full. Triggers call it on every mutation, so limits hold for direct API
 * calls too. No policies: only SECURITY DEFINER code touches the table.
 */
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userId: uuid("user_id").notNull(),
    action: text("action").notNull(),
  },
  (t) => [index("rate_limit_events_lookup_idx").on(t.userId, t.action, t.createdAt)],
).enableRLS();

/** Every outbound email, for the daily send budget (auth mail always keeps headroom). Service only. */
export const emailSends = pgTable(
  "email_sends",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    universityId: uuid("university_id"),
    kind: text("kind").notNull(),
    recipientHash: text("recipient_hash").notNull(),
    status: text("status").notNull().default("sent"),
    provider: text("provider").notNull().default("none"),
  },
  (t) => [index("email_sends_created_idx").on(t.createdAt)],
).enableRLS();

/** One row per weekly digest run per campus; admins can see delivery numbers, never recipients. */
export const digestRuns = pgTable(
  "digest_runs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    universityId: uuid("university_id").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    recipients: integer("recipients").notNull().default(0),
    sent: integer("sent").notNull().default(0),
    skipped: integer("skipped").notNull().default(0),
    details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [
    index("digest_runs_university_idx").on(t.universityId, t.createdAt),
    pgPolicy("digest_runs_admin_select", { for: "select", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}` }),
  ],
);
