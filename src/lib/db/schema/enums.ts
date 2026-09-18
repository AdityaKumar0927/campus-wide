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
export const postAudience = pgEnum("post_audience", ["campus", "meal_holders"]);
export const participantKind = pgEnum("participant_kind", ["rsvp", "seat", "member"]);
export const relayState = pgEnum("relay_state", ["open", "closed", "completed"]);
export const reportTarget = pgEnum("report_target", ["post", "comment", "thread", "profile"]);
export const reportCategory = pgEnum("report_category", ["harassment", "stalking", "scam", "impersonation", "hate", "sexual", "meal_resale", "prohibited_item", "spam", "other"]);
export const reportStatus = pgEnum("report_status", ["open", "in_review", "actioned", "dismissed"]);
export const moderationKind = pgEnum("moderation_kind", ["hide", "remove", "warn", "suspend", "ban", "restore", "dismiss", "privacy_mode"]);
export const appealStatus = pgEnum("appeal_status", ["open", "upheld", "overturned"]);
export const feedbackSentiment = pgEnum("feedback_sentiment", ["love", "good", "meh", "bad"]);
