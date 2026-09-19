# Data map

Every category of personal data the service holds, where it lives, who can reach it, and when it goes.
Aligned with the Privacy Notice; if the two ever disagree, the Privacy Notice is what members were told
and this document is wrong.

## Systems

| System | Role | Data it holds | Region |
|---|---|---|---|
| Supabase Postgres | Primary store | Everything below except request logs | AWS us-east-1 |
| Supabase Auth | Identity | Email address, sign-in codes, session rows (IP, user agent) | AWS us-east-1 |
| Supabase Storage | Files | Notice images (no photographs of people are permitted) | AWS us-east-1 |
| Vercel | Hosting | Short-lived request logs (IP, user agent, path) | Global edge; functions in iad1 |
| Resend (optional) | Email | Recipient address and message body for digests and notices | United States |
| Groq (optional, per campus) | AI | Thread or report text with identifiers removed before sending | United States |
| GitHub (optional) | Feedback | Feedback text and page URL | United States |
| Browser push services | Delivery | The endpoint the browser issued, plus the notification payload | Wherever the browser vendor operates |

## Categories

| Category | Tables | Who can read it | Retention |
|---|---|---|---|
| Identity | `users` | The member; the database trigger; nobody else, ever (RLS restricts to `auth.uid()`) | Life of account, purged 30 days after deletion |
| Public profile | `profiles` | Every member of the same campus, minus anyone who blocked them; initials only in privacy mode | Life of account; anonymised to "Former member" on deletion |
| Membership and role | `memberships` | Campus members (role), admins (status) | Life of account |
| Content | `posts`, `comments`, `reactions`, `poll_votes`, `post_participants` | Campus members, subject to blocks and the meal-holder audience | Until expiry or deletion; author detached on deletion |
| Private messages | `relay_threads`, `relay_messages` | The two participants and moderators | Thread life plus one year |
| Safety records | `reports`, `moderation_actions`, `appeals`, `audit_log`, `blocks`, `mutes` | Reporter or subject as applicable; moderators; admins for the audit log | Two years; pseudonymised after deletion |
| Consent | `consent_records`, `policy_versions` | The member | Life of account plus one year |
| Engagement | `notifications`, `push_subscriptions`, `digest_runs`, `email_sends` | The member (their own rows); admins see digest counts only | Notifications until deleted; `email_sends` stores a hash of the address, never the address |
| Operational | `rate_limit_events`, `deletion_requests`, `platform_settings` | Nobody through the API (service role only) | Rate-limit events pruned after a day |

## Flows that leave the database

1. **Sign-in code**: Supabase Auth sends it to the campus mailbox. No copy is stored by the app.
2. **Weekly digest**: `runWeeklyDigest()` reads the top notices and the opted-in members, and sends
   through Resend. Only a hash of each recipient lands in `email_sends`.
3. **Server AI**: only when a campus switches `ai_server` on and a key exists. `scrubPii()` removes
   emails, phone numbers, handles, links, and long numbers before the text leaves.
4. **Feedback forwarding**: to a GitHub issue or the admin mailbox, with the page URL only when the
   member ticked the box and the browser did not send Global Privacy Control.
5. **Web Push**: title, one line of body, and a path, to the endpoint the member's browser issued.

## Deletion

`request_account_deletion()` soft-deletes immediately and schedules the purge 30 days out;
`app.purge_deleted_accounts()` (run by the daily maintenance job) detaches the author from content,
rewrites the profile to "Former member", overwrites the email and declared name, and deletes blocks,
mutes, notifications, push subscriptions, space memberships, sign-ups, votes, and reactions. Reports
and moderation records survive under the pseudonymous user id for the retention period, exactly as the
Privacy Notice says.
