-- Phase 5 enum types, created ahead of the functions that reference them.
CREATE TYPE "public"."appeal_status" AS ENUM('open', 'upheld', 'overturned');
CREATE TYPE "public"."feedback_sentiment" AS ENUM('love', 'good', 'meh', 'bad');
CREATE TYPE "public"."moderation_kind" AS ENUM('hide', 'remove', 'warn', 'suspend', 'ban', 'restore', 'dismiss', 'privacy_mode');
CREATE TYPE "public"."report_category" AS ENUM('harassment', 'stalking', 'scam', 'impersonation', 'hate', 'sexual', 'meal_resale', 'prohibited_item', 'spam', 'other');
CREATE TYPE "public"."report_status" AS ENUM('open', 'in_review', 'actioned', 'dismissed');
CREATE TYPE "public"."report_target" AS ENUM('post', 'comment', 'thread', 'profile');
