# Launch checklist

Everything between "the code is ready" and "students are using it". Items marked **owner** need
someone with the accounts; the rest are already done or automated.

## 1. Accounts and keys (owner)

| Step | Where | Why it matters |
|---|---|---|
| Enable the two auth hooks | Supabase dashboard → Authentication → Hooks: `before_user_created_hook` and `custom_access_token_hook` | The first refuses non-campus sign-ups at the database; the second puts the campus id in the token. Without them the app still works (the helpers fall back to the membership row), but the API is no longer gated for direct callers |
| Paste the sign-in email template | Supabase → Authentication → Email templates → Magic Link: the contents of `supabase/templates/otp.html`, subject "Your Campus Wide sign-in code" | The default template has no `{{ .Token }}`, so the six-digit code never arrives |
| Set the site URL and redirect | Supabase → Authentication → URL configuration: `https://campus-wide.vercel.app` and `/auth/confirm` | One-tap links in the email fail otherwise |
| Verify a sending domain | Resend, then set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel | Without it the weekly digest is recorded as skipped and nothing is sent. The Vercel subdomain cannot carry DNS records, so a real domain is needed |
| Generate push keys | `pnpm push:keys`, then set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in Vercel | Without them the notifications section says so and does nothing |
| Wire the push webhook | Set `PUSH_DISPATCH_SECRET` in Vercel, then insert the same value plus `https://campus-wide.vercel.app/api/push/dispatch` into `platform_settings` | The database calls the app when a notification row is written |
| Optional: Turnstile | Supabase → Authentication → Bot protection, plus `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` | Adds a bot gate to every auth call, including direct API calls |
| Optional: server AI | `GROQ_API_KEY` in Vercel, then switch `ai_server` on in the admin portal | Summaries, translation, triage labels, paste-to-event |
| Optional: analytics | `NEXT_PUBLIC_UMAMI_SRC` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Cookieless and aggregate; skipped entirely when a browser sends Global Privacy Control |

Already set: `APP_URL`, `CRON_SECRET`, the Supabase connection values (through the Vercel integration),
and `ENABLE_EXPERIMENTAL_COREPACK`.

## 2. Campus setup (owner or campus admin)

1. Grant yourself `university_admin` (update your row in `memberships`, once).
2. Open `/admin`: confirm the domains, set the safe-exchange spots, choose which modules are on.
3. Appoint at least two moderators, so an appeal can always go to someone else.
4. Leave meal gifting off until the dining office answers in writing (Decision M-5).
5. Read [ADMIN_GUIDE.md](../ADMIN_GUIDE.md) once.

## 3. Scheduled jobs

`vercel.json` registers two crons: the weekly digest (Mondays 14:00 UTC) and daily maintenance
(06:30 UTC: expiries, suspensions that have run their course, and deletions past their grace period).
Both require `CRON_SECRET`. `pg_cron` also runs the hourly expiry sweep inside the database when the
extension is available.

## 4. Before announcing it

- [ ] Sign in as a student on a phone and a laptop, pin a notice, answer a question, take a tab.
- [ ] File a report from a second account and work it through to a decision and an appeal.
- [ ] Export your data and read the zip.
- [ ] Request deletion, then cancel it.
- [ ] Install the app on Android or iOS and confirm the offline notice appears in airplane mode.
- [ ] Fill in the `[PLACEHOLDER]`s in `content/policies/` (entity name, jurisdiction, contacts) and run
      `pnpm policies:sync` against production so the new versions are the ones members accept.
- [ ] Have a lawyer read the policies. The banner says they have not been.
- [ ] Seed the board with twenty real notices, so the first visitor does not see an empty room.

## 5. The first week

Watch the report queue daily, answer every report within 48 hours, and read the feedback on `/admin`.
If something is wrong, switch the module off rather than letting it fester: it is one click and it is
reversible.
