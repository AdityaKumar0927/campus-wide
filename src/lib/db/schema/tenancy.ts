import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { baseColumns, hasRole, sameTenant } from "./_shared";
import { campusRole, domainRequestStatus, domainSource, membershipStatus, universityStatus } from "./enums";

/** A campus is a tenant. Feature flags and policy text are explicit columns (ARCHITECTURE.md §3). */
export const universities = pgTable(
  "universities",
  {
    ...baseColumns,
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    country: text("country").notNull().default("US"),
    timezone: text("timezone").notNull().default("America/Chicago"),
    status: universityStatus("status").notNull().default("pending"),
    settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
    featureFlags: jsonb("feature_flags").notNull().default(sql`'{"meals": false}'::jsonb`),
    policyText: jsonb("policy_text").notNull().default(sql`'{}'::jsonb`),
    safeExchangeLocations: jsonb("safe_exchange_locations").notNull().default(sql`'[]'::jsonb`),
    diningLocations: jsonb("dining_locations").notNull().default(sql`'[]'::jsonb`),
    accentHue: text("accent_hue").notNull().default("155"),
  },
  (t) => [
    uniqueIndex("universities_slug_idx").on(t.slug),
    pgPolicy("universities_member_select", { for: "select", to: authenticatedRole, using: sql`${t.id} = app.current_university_id()` }),
    pgPolicy("universities_admin_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.id} = app.current_university_id() and ${hasRole("university_admin")}`,
      withCheck: sql`${t.id} = app.current_university_id() and ${hasRole("university_admin")}`,
    }),
  ],
);

/** Email domains that map a sign-up to a campus. Checked by the Before User Created hook. */
export const universityDomains = pgTable(
  "university_domains",
  {
    ...baseColumns,
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    /** Google Workspace hosted-domain claim expected for this domain (may equal the domain). */
    hostedDomain: text("hosted_domain"),
    role: campusRole("role").notNull().default("student"),
    verified: boolean("verified").notNull().default(false),
    source: domainSource("source").notNull().default("admin"),
  },
  (t) => [
    uniqueIndex("university_domains_domain_idx").on(t.domain),
    index("university_domains_university_idx").on(t.universityId),
    pgPolicy("university_domains_member_select", { for: "select", to: authenticatedRole, using: sameTenant(t.universityId) }),
    pgPolicy("university_domains_admin_write", {
      for: "all",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}`,
      withCheck: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}`,
    }),
  ],
);

/** Sign-up attempts from unknown domains, queued for review (never auto-approved). Service role only. */
export const domainRequests = pgTable(
  "domain_requests",
  {
    ...baseColumns,
    domain: text("domain").notNull(),
    emailHash: text("email_hash").notNull(),
    message: text("message"),
    status: domainRequestStatus("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [index("domain_requests_status_idx").on(t.status)],
).enableRLS();

/** One membership per user per campus. Roles live here, never in the JWT. */
export const memberships = pgTable(
  "memberships",
  {
    ...baseColumns,
    userId: uuid("user_id").notNull(),
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    campusRole: campusRole("campus_role").notNull().default("student"),
    status: membershipStatus("status").notNull().default("active"),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    /** Term of the last affiliation re-verification, e.g. "2026-fall". Stale terms become read-only. */
    verifiedTerm: text("verified_term"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ssoProviderId: text("sso_provider_id"),
    statusReason: text("status_reason"),
    /** Set by a suspension; a daily job restores the membership when it passes. */
    suspendedUntil: timestamp("suspended_until", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("memberships_user_university_idx").on(t.userId, t.universityId),
    index("memberships_university_role_idx").on(t.universityId, t.campusRole),
    pgPolicy("memberships_member_select", { for: "select", to: authenticatedRole, using: sameTenant(t.universityId) }),
    pgPolicy("memberships_admin_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}`,
      withCheck: sql`${sameTenant(t.universityId)} and ${hasRole("university_admin")}`,
    }),
  ],
);
