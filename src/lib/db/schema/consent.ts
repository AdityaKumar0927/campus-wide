import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { baseColumns, isOwner } from "./_shared";

/** Versioned policy documents (terms, privacy, safety, meal sharing, ...). Public to read. */
export const policyVersions = pgTable(
  "policy_versions",
  {
    ...baseColumns,
    /** Null = platform-wide; set = campus-specific text (e.g., meal-sharing terms). */
    universityId: uuid("university_id"),
    slug: text("slug").notNull(),
    version: text("version").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    contentPath: text("content_path").notNull(),
    contentHash: text("content_hash").notNull(),
    required: boolean("required").notNull().default(true),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("policy_versions_slug_version_idx").on(t.slug, t.version, t.universityId),
    pgPolicy("policy_versions_public_select", { for: "select", to: [anonRole, authenticatedRole], using: sql`true` }),
  ],
);

/** The consent ledger: one row per checkbox per policy version per user. Append-only. */
export const consentRecords = pgTable(
  "consent_records",
  {
    ...baseColumns,
    userId: uuid("user_id").notNull(),
    policyVersionId: uuid("policy_version_id").notNull().references(() => policyVersions.id),
    /** Which checkbox: "terms", "privacy", "safety_rules", "marketing" ... */
    choice: text("choice").notNull(),
    accepted: boolean("accepted").notNull(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    context: jsonb("context").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [
    index("consent_records_user_idx").on(t.userId, t.policyVersionId),
    pgPolicy("consent_records_self_select", { for: "select", to: authenticatedRole, using: isOwner(t.userId) }),
    pgPolicy("consent_records_self_insert", { for: "insert", to: authenticatedRole, withCheck: isOwner(t.userId) }),
    // No update/delete: a trigger also rejects them for the service role except purge jobs.
  ],
);
