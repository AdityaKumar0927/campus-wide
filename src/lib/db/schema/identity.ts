import { sql } from "drizzle-orm";
import { boolean, index, integer, pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { baseColumns, hasRole, isOwner, sameTenant } from "./_shared";
import { identityProvider } from "./enums";
import { universities } from "./tenancy";

/**
 * Private identity. Written only by the SECURITY DEFINER trigger on auth.users; the authenticated role
 * can read its own row and never sees anyone else's email.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // = auth.users.id
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    email: text("email").notNull(),
    emailDomain: text("email_domain").notNull(),
    /** Local part of the campus email (Illinois Tech: the UID, e.g. jdoe01). Never user-editable. */
    campusUsername: text("campus_username").notNull(),
    /** Declared once at onboarding, then locked; changed only by a moderator after an in-person check. */
    declaredGivenName: text("declared_given_name"),
    declaredFamilyName: text("declared_family_name"),
    nameLockedAt: timestamp("name_locked_at", { withTimezone: true }),
    /** Heuristic: first initial + family name (letters only) is a prefix of the UID. */
    nameMatchesUsername: boolean("name_matches_username").notNull().default(false),
    nameVerifiedInPersonAt: timestamp("name_verified_in_person_at", { withTimezone: true }),
    identityProvider: identityProvider("identity_provider").notNull().default("email"),
    /** True until the declared name exists; blocks posting and messaging. */
    namePending: boolean("name_pending").notNull().default(true),
    ageAttestedAt: timestamp("age_attested_at", { withTimezone: true }),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    pgPolicy("users_self_select", { for: "select", to: authenticatedRole, using: sql`${t.id} = auth.uid()` }),
  ],
);

/** Public-to-campus profile. Display name is derived from the verified name; users cannot set it. */
export const profiles = pgTable(
  "profiles",
  {
    ...baseColumns,
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    universityId: uuid("university_id").notNull().references(() => universities.id, { onDelete: "cascade" }),
    /** Given name plus family initial, generated in the database; initials only in privacy mode. */
    displayName: text("display_name").notNull(),
    initials: text("initials").notNull(),
    campusUsername: text("campus_username").notNull(),
    bio: text("bio"),
    classYear: integer("class_year"),
    helpedCount: integer("helped_count").notNull().default(0),
    thanksCount: integer("thanks_count").notNull().default(0),
    privacyMode: boolean("privacy_mode").notNull().default(false),
    /** Self-reported each term; the badge is labelled as such. */
    mealPlanAttestedTerm: text("meal_plan_attested_term"),
    mealPlanAttestedAt: timestamp("meal_plan_attested_at", { withTimezone: true }),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    /** Weekly digest email opt-in (marketing consent is separate and recorded in consent_records). */
    emailDigest: boolean("email_digest").notNull().default(true),
  },
  (t) => [
    uniqueIndex("profiles_user_idx").on(t.userId),
    index("profiles_university_idx").on(t.universityId),
    pgPolicy("profiles_member_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and not app.is_blocked_either_way(${t.userId})`,
    }),
    pgPolicy("profiles_owner_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${isOwner(t.userId)} and ${sameTenant(t.universityId)}`,
      withCheck: sql`${isOwner(t.userId)} and ${sameTenant(t.universityId)}`,
    }),
    pgPolicy("profiles_moderator_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${sameTenant(t.universityId)} and ${hasRole("moderator")}`,
      withCheck: sql`${sameTenant(t.universityId)} and ${hasRole("moderator")}`,
    }),
  ],
);
