import { pgEnum } from "drizzle-orm/pg-core";

export const campusRole = pgEnum("campus_role", ["student", "staff", "alumni", "moderator", "university_admin"]);
export const membershipStatus = pgEnum("membership_status", ["active", "read_only", "suspended", "banned"]);
export const universityStatus = pgEnum("university_status", ["pending", "active", "paused"]);
export const domainSource = pgEnum("domain_source", ["hipo", "admin", "seed"]);
export const identityProvider = pgEnum("identity_provider", ["google", "email", "saml"]);
export const domainRequestStatus = pgEnum("domain_request_status", ["pending", "approved", "rejected"]);
