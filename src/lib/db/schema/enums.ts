import { pgEnum } from "drizzle-orm/pg-core";

export const campusRole = pgEnum("campus_role", ["student", "staff", "alumni", "moderator", "university_admin"]);
export const membershipStatus = pgEnum("membership_status", ["active", "read_only", "suspended", "banned"]);
export const universityStatus = pgEnum("university_status", ["pending", "active", "paused"]);
export const domainSource = pgEnum("domain_source", ["hipo", "admin", "seed"]);
export const identityProvider = pgEnum("identity_provider", ["google", "email", "saml"]);
export const domainRequestStatus = pgEnum("domain_request_status", ["pending", "approved", "rejected"]);

/** Every notice type on the board. Type-specific fields live in posts.payload (Zod-validated per type). */
export const postType = pgEnum("post_type", ["question", "notice", "event", "listing", "meal", "lost", "found", "ride", "study", "roommate", "poll"]);
export const postStatus = pgEnum("post_status", ["active", "resolved", "expired", "removed", "deleted"]);
export const commentStatus = pgEnum("comment_status", ["active", "removed", "deleted"]);
export const reactionTarget = pgEnum("reaction_target", ["post", "comment"]);
export const reactionKind = pgEnum("reaction_kind", ["thanks"]);
export const spaceKind = pgEnum("space_kind", ["general", "course", "residence", "club", "interest"]);
export const spaceRole = pgEnum("space_role", ["member", "organizer"]);
export const notificationKind = pgEnum("notification_kind", ["answer", "comment", "accepted", "thanks", "relay", "moderation", "system", "digest"]);
