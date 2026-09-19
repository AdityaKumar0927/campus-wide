import { sql } from "drizzle-orm";
import { index, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

/**
 * Account deletion (docs/BRIEF.md §7, pilot §7): a request soft-deletes at once and schedules the
 * purge 30 days out; signing in within the window cancels it. Written by public.request_account_deletion().
 */
export const deletionRequests = pgTable(
  "deletion_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    purgedAt: timestamp("purged_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("deletion_requests_user_idx").on(t.userId),
    index("deletion_requests_due_idx").on(t.scheduledFor),
    pgPolicy("deletion_requests_self_select", { for: "select", to: authenticatedRole, using: sql`${t.userId} = auth.uid()` }),
  ],
);

/** Web Push subscriptions (Phase 7). One row per browser; the endpoint is the identity. */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userId: uuid("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint),
    index("push_subscriptions_user_idx").on(t.userId),
    pgPolicy("push_subscriptions_self_all", { for: "all", to: authenticatedRole, using: sql`${t.userId} = auth.uid()`, withCheck: sql`${t.userId} = auth.uid()` }),
  ],
);

/** Platform-wide settings the database needs at runtime (push dispatch URL and secret). Service role only. */
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
