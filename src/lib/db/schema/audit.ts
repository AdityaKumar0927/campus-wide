import { sql } from "drizzle-orm";
import { index, inet, jsonb, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { hasRole, sameTenant } from "./_shared";

/** Append-only audit log. A trigger rejects UPDATE and DELETE for every role. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    universityId: uuid("university_id"),
    actorId: uuid("actor_id"),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
    ipHash: text("ip_hash"),
    ip: inet("ip"),
  },
  (t) => [
    index("audit_log_university_created_idx").on(t.universityId, t.createdAt),
    index("audit_log_actor_idx").on(t.actorId),
    pgPolicy("audit_log_admin_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}`,
    }),
    // Inserts happen through app.log_audit() (SECURITY DEFINER) so callers cannot forge actor fields.
  ],
);
