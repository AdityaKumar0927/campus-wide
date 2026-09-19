import "server-only";
import { zipSync, strToU8 } from "fflate";
import { createClient } from "@/lib/supabase/server";

/**
 * Everything the service holds about the caller, as a zip of JSON files plus a readme
 * (docs/BRIEF.md §7). Every query runs as the caller through RLS, so the archive can only ever
 * contain rows that person is allowed to see.
 */
export interface ExportBundle {
  bytes: Uint8Array;
  filename: string;
}

const README = `Campus Wide data export

Everything the board holds about you, as JSON. Files:

  account.json        your identity, membership, and profile as the campus sees it
  notices.json        everything you pinned, with its type-specific fields
  replies.json        your answers and replies
  reactions.json      the thank-yous you gave
  participation.json  events, rides, and study groups you signed up for, and your poll votes
  threads.json        relay threads you took part in, with every message
  spaces.json         the spaces you joined
  notifications.json  your inbox
  reports.json        reports you filed and moderation decisions about you
  consents.json       which policy version you accepted, when, and from which device
  sessions.json       where you are signed in right now

What is not here: other people's private data, the evidence bundles attached to reports filed
about you by others (they are kept for the retention period and are visible to moderators only),
and anything the board never collected (photographs of people, phone numbers, payment details).

Questions: see the Privacy Notice at /policies/privacy.
`;

export async function buildExportBundle(userId: string): Promise<ExportBundle> {
  const supabase = await createClient();
  const [users, profile, membership, posts, comments, reactions, participants, votes, threads, messages, spaces, notifications, reports, actions, appeals, consents, sessions] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("memberships").select("*").eq("user_id", userId),
    supabase.from("posts").select("*").eq("author_id", userId).order("created_at"),
    supabase.from("comments").select("*").eq("author_id", userId).order("created_at"),
    supabase.from("reactions").select("*").eq("user_id", userId),
    supabase.from("post_participants").select("*").eq("user_id", userId),
    supabase.from("poll_votes").select("*").eq("user_id", userId),
    supabase.from("relay_threads").select("*"),
    supabase.from("relay_messages").select("*").order("created_at"),
    supabase.from("space_memberships").select("*").eq("user_id", userId),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("reports").select("id, case_number, category, status, created_at, resolved_at, note").eq("reporter_id", userId),
    supabase.from("moderation_actions").select("*").eq("subject_id", userId),
    supabase.from("appeals").select("*").eq("appellant_id", userId),
    supabase.from("consent_records").select("*").eq("user_id", userId).order("created_at"),
    supabase.rpc("list_my_sessions"),
  ]);

  const json = (value: unknown) => strToU8(JSON.stringify(value ?? null, null, 2));
  const stamp = new Date().toISOString().slice(0, 10);
  const files: Record<string, Uint8Array> = {
    "README.txt": strToU8(README),
    "account.json": json({ exported_at: new Date().toISOString(), user: users.data, profile: profile.data, memberships: membership.data ?? [] }),
    "notices.json": json(posts.data ?? []),
    "replies.json": json(comments.data ?? []),
    "reactions.json": json(reactions.data ?? []),
    "participation.json": json({ sign_ups: participants.data ?? [], poll_votes: votes.data ?? [] }),
    "threads.json": json(
      (threads.data ?? []).map((t) => ({ ...t, messages: (messages.data ?? []).filter((m) => m.thread_id === t.id) })),
    ),
    "spaces.json": json(spaces.data ?? []),
    "notifications.json": json(notifications.data ?? []),
    "reports.json": json({ filed_by_me: reports.data ?? [], decisions_about_me: actions.data ?? [], my_appeals: appeals.data ?? [] }),
    "consents.json": json(consents.data ?? []),
    "sessions.json": json(sessions.data ?? []),
  };
  return { bytes: zipSync(files, { level: 6 }), filename: `campus-wide-export-${stamp}.zip` };
}
