# Security verification (Phase 8)

Verified on 2026-09-19 against the code in `main` and the production deployment at
https://campus-wide.vercel.app. Every row says how it was checked, not just what was intended.

## Headers and Content Security Policy

| Control | How it is built | Evidence |
|---|---|---|
| CSP with a per-request nonce | `src/proxy.ts` mints a nonce, passes it via `x-nonce`, and `src/lib/security/csp.ts` builds the policy | `tests/unit/csp.test.ts` (8 cases) and an assertion on every HTML response in `tests/e2e/smoke.spec.ts` |
| Optional hosts are opt-in | Supabase, Umami, Turnstile, and the model CDNs appear only when their env var is set | Unit test: the default policy contains none of them |
| `style-src 'unsafe-inline'` | Accepted: Sonner and Base UI inject styles at runtime without nonce support, and a nonce would make `unsafe-inline` ignored. Scripts stay nonce-gated with `strict-dynamic`, which is what stops XSS | Unit test asserts `script-src` has no `'unsafe-inline'` |
| HSTS, Referrer-Policy, Permissions-Policy, COOP, CORP, nosniff | `src/lib/security/headers.ts` via `next.config.ts` | Asserted on every HTML response in the smoke test, and observed on production on 2026-09-19 (below) |
| `x-middleware-subrequest` (CVE-2025-29927) | Next 16.3.5 is patched; the proxy drops the header anyway, and authorization never lives there | Code review; the DAL and RLS are the two independent gates |

### Observed on production, 2026-09-19

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic' 'wasm-unsafe-eval'; …
Strict-Transport-Security: max-age=63072000; includeSubDomains
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
```

The nonce differs on every request, which also confirms the page is rendered per request rather than
served from a static cache.

## Accessibility

Automated WCAG 2.2 AA checks (axe, tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) run inside the
end-to-end suite at 390 px and 1440 px on the landing page, the offline notice, the feed, settings,
the policies, a policy document, the composer, a thread, the relay thread, the report form, the
moderation queue, the appeal page, the admin portal, and the consent gate. A violation fails the build.
Lighthouse scores accessibility 100 on every public route; the two issues it found during the Phase 8
sweep (a missing `main` landmark on the auth pages, and buttons whose accessible name did not contain
their visible text) were fixed rather than waived.

## Authorization

Two independent layers, both enforced for every request:

- **Postgres RLS** on every table, with the tenant predicate `university_id = app.current_university_id()`. 52 integration tests in `tests/rls/` prove isolation, ownership, role gates, blocks, audience limits, and rate limits, including that a second campus sees nothing.
- **The Data Access Layer** (`src/lib/dal/`) starts from `getSession()`, which reads signature-verified claims through `getClaims()` on every request. `requireMember()` and `requireRole()` throw before any query runs.

Roles come from `memberships`, never from the JWT, so a demotion or a ban applies on the next request.

## Rate limiting

Implemented in Postgres (D-22) so limits hold for anyone calling the API directly with the publishable
key, not only for the app.

| Action | Limit | Where |
|---|---|---|
| Pin a notice | 10/hour, 3/hour in the first week | `app.protect_post()` |
| Reply | 30/hour, 10/hour in the first week | `app.protect_comment()` |
| Thank-you | 60/hour | `app.before_reaction_insert()` |
| Sign up for an event, ride, or group | 30/hour | `app.before_participant_insert()` |
| Vote in a poll | 60/hour | `app.before_poll_vote()` |
| Open a relay thread | 20/day, 5/day in the first week | `app.before_relay_thread_insert()` |
| Relay message | 60/hour | `app.before_relay_message_insert()` |
| File a report | 10/day | `public.file_report()` |
| Server AI call | 30/day (60 for moderators) | `public.take_rate_limit()` |

The sign-in endpoint is limited by Supabase Auth itself (one code per address per minute) and by the
database allowlist check in front of it. Turnstile is configured but deferred by the owner; when its
keys are set, Supabase Auth requires the token on every auth call, including direct API calls.

## Outbound requests (SSRF)

The service makes four kinds of outbound request, all to fixed hosts compiled into the code, none of
them built from user input:

| Destination | Where | User input in the URL? |
|---|---|---|
| Resend API | `src/lib/email/send.ts` | No |
| Groq API | `src/lib/ai/groq.ts` | No |
| GitHub issues API | `src/components/shell/feedback-actions.ts` | No: the repository comes from an env var |
| Web Push endpoints | `src/lib/push/server.ts` via `web-push` | The endpoint comes from the browser's push service, stored per subscription, and is only ever used to deliver that subscription's own message |

There is no fetch-a-URL-for-me feature, no link unfurling, and no image proxying, so there is no path
that turns a member's text into an outbound request. A future feature that needs one must go through
an allowlist helper before it ships.

## Uploads

Images are downscaled in the browser to WebP at most 1 MB (`src/lib/uploads/downscale.ts`), then
uploaded straight to the `post-images` bucket. The bucket enforces a 1 MB cap and an image MIME
allowlist, and its RLS policies require the path to start with the caller's campus id and the owner to
be the caller. Server-side re-encoding is deliberately not done: the pilot forbids photographs of
people, the bucket already constrains type and size, and adding `sharp` would pull a native binary
into the free tier for little gain. This is recorded as a known deviation from the brief.

## Secrets and supply chain

- Secrets live only in the hosting provider's environment; `.env.example` documents every variable and
  gitleaks runs on every push.
- `pnpm-lock.yaml` is committed, CI installs with `--frozen-lockfile`, and `pnpm-workspace.yaml` sets
  `minimumReleaseAge: 1440`, `trustPolicy: no-downgrade`, and an explicit `allowBuilds` list, so no
  dependency runs a postinstall script without review.
- `pnpm audit --audit-level high`, CodeQL, and Dependabot (grouped weekly) run in CI.

## Audit trail

`audit_log` is append-only (a trigger rejects update and delete for every role) and records name
declarations, session revocations, reports, every moderation decision, appeals, block patterns,
deletion requests, and purges. Campus admins can read their own campus's entries; nobody can edit them.

## Client-side state

Three components read the environment (install capability, push capability, the browser-model
preference) rather than copying it into React state inside an effect, using `useSyncExternalStore`
with a server snapshot. This is not a security control, but it is why those components render the same
thing on the server and the client, which matters for the Content Security Policy: a hydration mismatch
would otherwise be papered over by client-side re-rendering that the nonce does not cover.

## Known deviations from the brief

1. **Rate limiting is in Postgres, not Upstash** (D-22). Fewer moving parts and it cannot be bypassed.
2. **No server-side image re-encode** (see Uploads above).
3. **Turnstile and Resend are not configured yet** by owner decision; the code paths exist and are inert.
