import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { hasRole, sameTenant } from "./_shared";
import { appealStatus, feedbackSentiment, moderationKind, reportCategory, reportStatus, reportTarget } from "./enums";
import { profiles } from "./identity";
import { universities } from "./tenancy";

const rowColumns = {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * Notice-and-action reports (DSA Art. 16). Written only by public.file_report(), which snapshots the
 * evidence (item, thread, handles, timestamps, block state) so nothing can be edited away later.
 */
export const reports = pgTable(
  "reports",
  {
    ...rowColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    caseNumber: text("case_number").notNull(),
    reporterId: uuid("reporter_id").notNull(),
    subjectId: uuid("subject_id").references(() => profiles.userId, { onDelete: "set null" }),
    targetType: reportTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    category: reportCategory("category").notNull(),
    note: text("note"),
    evidence: jsonb("evidence").notNull().default(sql`'{}'::jsonb`),
    status: reportStatus("status").notNull().default("open"),
    assignedTo: uuid("assigned_to"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    /** Reporter agreed to escalation to campus offices (pilot §5). */
    escalationConsent: boolean("escalation_consent").notNull().default(false),
    /** Optional AI triage labels (Phase 6): suggestions for ordering only; never an action. */
    triage: jsonb("triage"),
  },
  (t) => [
    uniqueIndex("reports_case_idx").on(t.caseNumber),
    index("reports_queue_idx").on(t.universityId, t.status, t.createdAt),
    index("reports_reporter_idx").on(t.reporterId),
    index("reports_subject_idx").on(t.subjectId),
    pgPolicy("reports_reporter_or_moderator_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.reporterId} = auth.uid() or ${hasRole("moderator")})`,
    }),
    pgPolicy("reports_moderator_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and ${hasRole("moderator")}`,
      withCheck: sql`${sameTenant(t.universityId)} and ${hasRole("moderator")}`,
    }),
  ],
);

/** Every moderation decision, with a statement of reasons (DSA Art. 17). Written by public.moderate(). */
export const moderationActions = pgTable(
  "moderation_actions",
  {
    ...rowColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
    moderatorId: uuid("moderator_id").notNull(),
    subjectId: uuid("subject_id").references(() => profiles.userId, { onDelete: "set null" }),
    targetType: reportTarget("target_type"),
    targetId: uuid("target_id"),
    kind: moderationKind("kind").notNull(),
    /** { facts, ground, automated: false, redress } as the DSA requires. */
    statementOfReasons: jsonb("statement_of_reasons").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversedBy: uuid("reversed_by"),
  },
  (t) => [
    index("moderation_actions_subject_idx").on(t.subjectId, t.createdAt),
    index("moderation_actions_university_idx").on(t.universityId, t.createdAt),
    pgPolicy("moderation_actions_subject_or_moderator_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.subjectId} = auth.uid() or ${hasRole("moderator")})`,
    }),
  ],
);

/** One appeal per action, decided by a different moderator or an admin. Written by public.appeal(). */
export const appeals = pgTable(
  "appeals",
  {
    ...rowColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    actionId: uuid("action_id").notNull().references(() => moderationActions.id, { onDelete: "cascade" }),
    appellantId: uuid("appellant_id").notNull(),
    text: text("text").notNull(),
    status: appealStatus("status").notNull().default("open"),
    reviewedBy: uuid("reviewed_by"),
    decisionReasons: text("decision_reasons"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("appeals_action_idx").on(t.actionId),
    check("appeals_text_length", sql`char_length(text) between 10 and 4000`),
    pgPolicy("appeals_appellant_or_moderator_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and (${t.appellantId} = auth.uid() or ${hasRole("moderator")})`,
    }),
  ],
);

/** The feedback popover. Page URL and user agent are stored only with consent. */
export const feedback = pgTable(
  "feedback",
  {
    ...rowColumns,
    universityId: uuid("university_id"),
    userId: uuid("user_id"),
    sentiment: feedbackSentiment("sentiment").notNull(),
    message: text("message").notNull(),
    pageUrl: text("page_url"),
    userAgent: text("user_agent"),
    consent: boolean("consent").notNull().default(false),
    forwardedTo: text("forwarded_to"),
  },
  (t) => [
    index("feedback_created_idx").on(t.createdAt),
    check("feedback_message_length", sql`char_length(message) between 1 and 2000`),
    pgPolicy("feedback_insert", { for: "insert", to: [anonRole, authenticatedRole], withCheck: sql`(${t.userId} is null or ${t.userId} = auth.uid())` }),
    pgPolicy("feedback_admin_select", { for: "select", to: authenticatedRole, using: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}` }),
  ],
);
