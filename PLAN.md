# Campus Wide — Delivery Plan

**Status:** Plan approved 2026-09-16. Phase 2 built for the Illinois Tech pilot; production Supabase (us-east-1) migrated and seeded 2026-09-17; Vercel deploys from GitHub. Remaining before real sign-ins: Supabase Auth hooks/template/URLs on the production project (owner STOP), then Phase 3. · **Owner:** Aditya Kumar (AdityaKumar0927) · **Repo:** https://github.com/AdityaKumar0927/campus-wide
**Source of truth:** `docs/BRIEF.md`. Verified versions/limits: `docs/research/2026-09-15-stack-verification.md`.
**Live checklist:** `TASKS.md`. **Milestones:** `ROADMAP.md`. **System design:** `ARCHITECTURE.md`.

## 1. What we are building
A multi-tenant web platform any university can adopt. Verified students (university email) get a calm, identity-accountable community: feed, Q&A with accepted answers, events with RSVP/.ics, a no-payment marketplace with masked contact, a gifting-only meal board (off by default), lost & found, rides, study groups, roommates, polls, human-first moderation with appeals, a university admin portal, real compliance functionality (consent ledger, export, deletion, DSA notice-and-action), and privacy-preserving in-browser AI helpers. Free tier everywhere; upgrade paths documented.

## 2. Verified stack (pinned in Phase 1)
Next.js **16.3.5** (App Router, RSC, Server Actions, Turbopack, `proxy.ts`) · React **19.3** · TypeScript (JS-based line as scaffolded; TS 7 native compiler evaluated later) · Tailwind **4.3** · shadcn CLI **4.21** (Base UI primitives) · Supabase (Postgres + RLS + pgvector, Auth, Storage, Realtime) via `@supabase/ssr` **0.12** / `supabase-js` **2.116** · Drizzle ORM **0.45** + drizzle-kit **0.31** · Resend **6.28** + React Email · Zod **4.6** · next-themes **0.4.6** · Serwist **9.5** (core lib) · Vitest **5** · Playwright **1.63** + axe · ESLint **10** · Transformers.js **4.2** · Upstash ratelimit **2.1** · Turnstile · motion **13**. Runtime: **Node 24 LTS**, **pnpm 12**.

## 3. Decisions (with rationale)
| # | Decision | Why |
|---|---|---|
| D-01 | **Node 24 LTS + pnpm 12 (corepack)**; `.nvmrc`/`engines` enforced | Node 25 (installed locally) is EOL since 2026-06 and not offered by Vercel; vitest 5 and supabase-js 2.116 require Node ≥22. |
| D-02 | **Authorization lives in the Data Access Layer + Postgres RLS.** `proxy.ts` only refreshes the session cookie, generates the CSP nonce, sets security headers, and redirects unauthenticated users for UX. CVE-2025-29927 is mitigated by running patched Next.js, by Vercel filtering `x-middleware-subrequest` at its edge, and by never treating proxy as the security boundary; proxy also drops the header before any onward forwarding as defence in depth only. | Stripping the header inside proxy cannot itself stop the CVE (the runtime skipped middleware before it ran). Both real layers are tested: RLS via cross-tenant SQL tests, DAL via unit tests. |
| D-03 | **Tenant-implicit routing.** A user belongs to exactly one university (from verified email). Authenticated routes never carry the tenant in the URL; the DAL derives it from the session. Only public pages use `/campus/[slug]`. | Removes a class of URL-tampering bugs; no wildcard DNS needed on Vercel Hobby. Custom domains per campus can be layered on later. |
| D-04 | **Auth = magic link + 6-digit email OTP (primary); passkeys as a feature-flagged beta**; SAML/OIDC SSO designed-for, not built. Supabase Auth itself is hardened: Turnstile captcha on auth endpoints, auth email rate limits, and the domain allowlist enforced in the database. | Supabase passkeys are public beta (2026-05-28), API experimental; SSO needs Pro. Auth endpoints are reachable with the publishable key, so app-side checks alone can be bypassed. |
| D-05 | **Schema + migrations in Drizzle; RLS policies live in the same schema files** (`pgPolicy`, `pgTable.withRLS`); Supabase local (Docker) runs the RLS suite in CI. | One source of truth; policy drift is caught by tests. |
| D-06 | **Email via Resend configured as Supabase Auth custom SMTP** (smtp.resend.com:465); Supabase templates customised (`{{ .Token }}` for OTP). **Transactional mail (auth, relay, moderation) is sent immediately; all other notifications go to a weekly digest** (daily digest is an upgrade trigger) behind a send-budget guard that reserves headroom for auth mail. | Supabase built-in mailer is 2 messages/hour; Resend free = 100/day, which a daily digest would exhaust at roughly 80 opted-in users. |
| D-07 | **PWA with the Serwist core library compiled by esbuild in `prebuild`.** Precache is limited to the offline page and public assets; hashed `_next/static` files are runtime-cached (cache-first), so no build manifest is needed. `@serwist/turbopack` is the fallback. | `@serwist/next` is webpack-only; a pre-build script cannot know Next's hashed output, so precaching the app shell is not attempted. |
| D-08 | **Analytics = Umami Cloud Hobby (cookieless) by default**, PostHog EU as the alternative; script injected only when configured and never when Global Privacy Control is set. Field Core Web Vitals via Vercel Speed Insights (Hobby quota) or `web-vitals` events to Umami. | Plausible has no free hosted tier. Cookieless + strictly-necessary cookies = no consent banner. |
| D-09 | **Server-side AI = Groq (default), OpenRouter `:free` (secondary). Gemini free tier excluded by default.** All server AI is opt-in per campus and per user, PII-stripped, labelled "leaves your device". | Groq contractually does not train on inputs and offers zero-data-retention; Gemini's unpaid tier trains on content. |
| D-10 | **Public GitHub repository** (created 2026-09-16). | Free CodeQL, secret scanning, and unlimited Actions minutes. |
| D-11 | **Rate limiting = Upstash Redis sliding window on every mutation and auth endpoint; fails closed in production if keys are missing; in-memory limiter only in dev/test.** Upstash + Turnstile keys are therefore required at the launch STOP. | An in-memory limiter is ineffective across serverless instances; fail-open rate limiting is an OWASP 2025 A10 finding. |
| D-12 | **Hosting = Vercel Hobby for the pilot; Pro the moment a university adopts it for production.** | Hobby is non-commercial only; donations are explicitly allowed. |
| D-13 | **Meal board is gifting/treating + donation only, admin toggle OFF by default, per-campus policy text required before enabling.** Item kinds: guest pass, meal swipe, dining dollars — all gift-only, no price fields exist. | Resale is prohibited by dining contracts everywhere; students have been disciplined for it. |
| D-14 | **No payments anywhere. Marketplace contact = double-blind in-app messaging with email notifications; addresses are revealed only on mutual opt-in.** This deviates from the brief's "masked email relay" wording: no inbound-email parsing is needed, which keeps it on free tiers. True email-in/email-out relay is a post-launch option. **Owner to confirm.** | Keeps PCI out of scope; protects student emails; avoids a paid inbound-mail dependency. |
| D-15 | **Design to WCAG 2.2 AA**, verified with axe in Playwright plus manual keyboard and screen-reader passes. Pa11y is not added: it wraps the same axe-core engine. | Superset of ADA Title II (WCAG 2.1 AA) and EN 301 549. |
| D-16 | **Licence: MIT** (owner decision, 2026-09-16). | Maximises university adoption and contributions; no copyleft obligations for campuses that fork. |
| D-17 | **Hosting URL: a Vercel subdomain (`campus-wide.vercel.app`, unassigned as of 2026-09-16); no custom domain** (owner decision). **Consequence:** Resend cannot verify a sending domain without DNS you control, so magic links to real students need a domain before Phase 2 goes beyond local testing (local dev uses the Supabase mail catcher, so Phases 1–3 are unblocked). | Zero cost during the build; the cheapest unblock is a ~$10/year domain when the pilot needs real sign-ups. |
| D-19 | **Pilot campus: Illinois Institute of Technology (Mies Campus, Chicago).** Design in `docs/pilot/illinois-tech.md`. Identity = proof of control of a campus mailbox (`@hawk.illinoistech.edu`, legacy `@hawk.iit.edu`; staff `@illinoistech.edu`/`@iit.edu`) via six-digit code + magic link; **no SSO** (Illinois Tech moved to Microsoft 365 and its Acceptable Use Policy forbids third-party authentication with campus credentials without a sponsored OTS review). | Verified against iit.edu/OTS on 2026-09-17; the only permissible, image-free verification path. |
| D-20 | **The UID is the accountability anchor.** Profiles show `@uid` from the verified address (never editable). The human name is declared once at onboarding, locked, cross-checked against the UID pattern, shown as "First L.", and corrected only by a moderator after an in-person HawkCard check. No profile photos in the pilot. | M365 display names are self-editable and unreachable without SSO; photos are the AI-fake vector; the UID maps to one real person in university systems. |
| D-21 | **Meal board = "guest meal treats at The Commons", nothing broader.** Only self-attested All Access holders (10 guest meals per semester) may offer; treats happen in person at the register with the holder present; private request board; no transfers, no TechCash, no card handling; semester-scoped; flag stays OFF until the owner confirms the Room and Board Contract wording. | Only All Access carries guest meals; "the cardholder must be present" and lending a HawkCard is prohibited (Residence Life Handbook 2026–27, Code of Conduct). |
| D-18 | **Design direction: "the notice board".** (Revised 2026-09-17 after the owner look review: v1 "campus editorial" was clean but generic.) The campus bulletin board is the product's real ancestor, so the UI is a board: notice types are paper stocks (white index card, manila listing, blue question, yellow sticky, pink expiring, green ride/gift) held by a pin; the marketplace relay is literal tear-off tabs; metadata is typewritten mono stamps; the logo is a pin; copy is specific to campus life. Restraint stays: flat colour, ≤ 2° rotations, one faint cork-dot grid, no textures or skeuomorphic shadows. Type (revised 2026-09-17 on owner feedback: slim, tight, no italics, no serif): Bricolage Grotesque headlines at 400 with −0.045em tracking (h3 at 500), Manrope UI, JetBrains Mono stamps; italics are not part of the system. Hero visual: the rubber-stamp seal at hero scale (spinning promises, double ring, pin) with a soft red "live" ripple; a dotted Chicago map was tried and rejected. Magic UI additions: dock of modules, orbiting module icons, an icon cloud of campus objects, one comic-text moment (feedback thank-you). Per-campus accent hue retained. Motion vocabulary (added 2026-09-17, Magic UI MIT registry `@magicui`, reinterpreted as board artifacts): twine beams for the relay explainer, marker-pen highlights, a spinning rubber-stamp seal, paper-scrap confetti on feedback, and a circular theme wipe; every piece degrades under reduced motion and none is required for content. | A recognisable, ownable metaphor every campus already shares; nothing in the category looks like it; it maps one-to-one onto the feature set. |

## 4. Phases and Definitions of Done
Each phase ends with green CI, updated docs, and ticks in `TASKS.md`. **STOP** = owner action required; I pause with numbered instructions.

### Phase 0 — Planning ✅ (audited 2026-09-16)
Deliverables: `PLAN.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `TASKS.md`, `CLAUDE.md`, `docs/BRIEF.md`, `docs/research/*`, `docs/audits/*`, GitHub repo with Dependabot and a `main` ruleset.
**DoD:** owner approves the plan (repo, licence, domain already decided; pilot campus and region still open).

### Phase 1 — Repo, CI, skeleton, design system ✅ (built 2026-09-16; look review + Vercel link pending)
- Install Node 24 LTS + pnpm 12 (corepack); `create-next-app@latest` (TypeScript strict, Tailwind v4, App Router, `src/`, Turbopack); shadcn init (Base UI primitives).
- Repo hygiene: `.env.example`, `.nvmrc`, `.editorconfig`, commitlint + Husky (conventional commits), `CODEOWNERS`, issue/PR templates, `SECURITY.md`, `CONTRIBUTING.md`, expanded `README.md`; pnpm minimum-release-age setting.
- GitHub: Dependabot `dependabot.yml` (npm + actions, weekly, grouped); CodeQL; gitleaks; ruleset upgraded to require the CI checks and pull requests.
- CI: install → typecheck → lint → Vitest → build → Playwright (chromium at 390 px and 1440 px) with axe and `toHaveScreenshot` baselines; reports and screenshots uploaded as artifacts.
- App skeleton: root layout, `proxy.ts` (session refresh stub, nonce + security headers, defence-in-depth header drop), theme provider (light/dark/system), OKLCH `@theme` tokens per D-18, self-hosted variable fonts, mobile bottom nav + desktop sidebar shell, empty-state components, Feedback button stub, `/.well-known/security.txt`, `/api/health`.
- **Phase 1 exit STOP (recommended): link Vercel** so every pull request gets a preview URL and Vercel-specific behaviour (proxy on Node, nonce CSP, cron) is exercised from day one. Env vars are not needed until Phase 2.
- **DoD:** CI green on `main`; Lighthouse ≥ 95 on the skeleton at both viewports (accessibility, best-practices, SEO verified at 100 locally; the performance score is verified on the Vercel preview because Lighthouse's simulator understates text-LCP pages on localhost, see `scripts/lighthouse.mjs`); screenshots in `docs/screenshots/phase-1/`; **owner reviews the look against D-18**; README quick-start works from a clean clone.

### Phase 2 — Auth, multi-tenancy, RLS, consent (in progress 2026-09-17; local stack first) → **STOP before production: Supabase project in us-east-2 with Turnstile + OTP template, Resend + sending domain, owner reads the Room and Board Contract**
- Supabase CLI as a dev dependency; `supabase start` locally (Docker) and in CI. Drizzle schema for every table in `docs/BRIEF.md §4`, each with `university_id` and RLS policies (`pgPolicy` + `drizzle-orm/supabase` roles); migrations committed; pgvector enabled.
- Tenant resolution: `university_domains` seeded from the Hipo list (MIT); a demo campus is seeded until the owner names the pilot campus. The **domain allowlist is enforced in the database** (Supabase before-user-created hook, verify availability; fallback: BEFORE INSERT trigger on `auth.users`), not only in the form. Unknown domain → `domain_requests` queue.
- Membership is created by a trigger on `auth.users` **when `email_confirmed_at` becomes non-null** (not on insert, which happens at OTP request). A custom access token hook (Postgres variant, verify Free-plan availability) adds `university_id` to the JWT; roles are read from `memberships` so demotions apply immediately.
- Auth hardening: Turnstile captcha enabled in Supabase Auth; auth email rate limits set; Resend custom SMTP; cookie sessions via `@supabase/ssr` with `getClaims()` in proxy and DAL; session list via a SECURITY DEFINER function over `auth.sessions`; sign out everywhere; age attestation; optional verified secondary email for recovery after graduation.
- Consent ledger: `policy_versions` + `consent_records` (version, timestamp, IP hash, UA, per-checkbox); **marketing opt-in is a separate, unchecked box**; re-consent gate on version bump; downloadable copy.
- Operations: **keep-alive GitHub Action (daily) calling Supabase REST directly** with URL + publishable key as repo secrets (the app is not deployed yet); **nightly `pg_dump` Action, age-encrypted, kept 30 days** (Free has no backups); note that GitHub disables schedules after 60 days without commits.
- Data Access Layer `src/lib/dal/*`: every query takes the caller session and scopes by tenant; unit-tested. Rate limiting (D-11) on every auth mutation.
- **Cross-tenant isolation suite** (Vitest against local Supabase): for every table, a user of university X cannot read or write university Y rows via anon, authenticated, or forged-claim paths.
- Phase 2b (feature flag): passkeys beta (`auth.experimental.passkey`) register / sign in / manage.
- **DoD:** isolation suite green in CI; new user signs up with a seeded domain, consents, lands in their campus; a non-allowlisted address is rejected at the database; export and deletion endpoints scaffolded; backup and keep-alive runs visible in Actions.

### Phase 3 — Core content
Posts (one table, type enum, type-specific JSONB validated by a Zod schema per type; **plain text with link detection, Markdown deferred**), comments/answers with accepted answer, Thank-you/Helped reactions, spaces + memberships, chronological feed with a "most helpful" toggle and paged (never infinite) loading, Q&A views, Postgres full-text search, notifications table + in-app inbox (**Realtime subscribed only on the inbox, polling fallback**), **weekly digest** (Vercel cron) behind the send-budget guard. Rate limits and the upload pipeline (client downscale ≤ 1 MB → server re-encode) land here with avatars.
**DoD:** E2E ask → answer → accept → thank; feed paging; digest rendered and budget-guarded; isolation suite extended to new tables.

### Phase 4 — Modules
Events (RSVP, `.ics` export), Marketplace (listings with images, prohibited-items check, safety tips, **per-campus safe-exchange locations**, **double-blind in-app relay** with mutual reveal, D-14), Meal Gifting (**flag OFF**, per-campus policy text gate, kinds per D-13, gifting/treating + donation pathway), Lost & Found, Rides, Study groups, Roommate/sublet, Polls; expiry sweeper via Supabase `pg_cron`.
**DoD:** every module has create / list / detail / expire E2E coverage at both viewports; the relay never leaks an address (asserted on rendered HTML and on the outgoing mail payload).

### Phase 5 — Moderation, admin portal, feedback widget
Report (DSA notice-and-action categories), mute, block, moderator queue, actions with a **statement of reasons**, appeals, audit log, trusted-student moderator role; university admin portal (campus settings, domains, feature flags, policy text, safe-exchange locations, moderators, aggregate non-PII analytics, new-campus verification via admin email domain); public campus stats page; Feedback popover (four sentiments, page URL + UA with consent, forwards to a GitHub Issue or the admin email).
**DoD:** report → action → statement of reasons → appeal E2E; admin can toggle every module; feedback lands in the DB and in GitHub or email.

### Phase 6 — AI enhancements (progressive)
In-browser (Transformers.js + WebGPU, feature-detected, web worker, lazy, **downloads gated on Wi-Fi / no `saveData`**): duplicate-question suggestions (embedding computed on-device at post time and stored in `posts.embedding` via pgvector; matches via an RPC) and the pre-post toxicity nudge (toxic-bert baseline; evaluate a MiniLM-sized classifier). Chrome Prompt API (`LanguageModel`, Chrome 148+, desktop) for optional thread summaries only. Opt-in server fallback via Groq for summaries, translation, mod-queue triage (labels only; a human decides), and AI-assisted event creation from pasted text.
**DoD:** all AI features degrade to no-ops without WebGPU/Prompt API; no core flow waits on a model download; tests cover the no-AI path.

### Phase 7 — Legal docs, compliance functionality, accessibility, PWA
All 14 policy documents as MDX with `[PLACEHOLDER]`s and the not-legal-advice banner, versioned in `policy_versions`; Global Privacy Control honoured; Cookie Policy page; DSA point-of-contact page; export (JSON zip); **deletion = anonymise content that others depend on, purge identity and private data** (soft-delete then daily purge after 30 days); WCAG 2.2 AA pass; PWA (manifest, icons, Serwist offline shell per D-07, install prompt before notification permission, Web Push with email fallback).
**DoD:** axe reports zero violations on every route at both viewports; PWA installs on Android, iOS, and desktop; export and deletion verified E2E.

### Phase 8 — Hardening verification, performance, HECVAT readiness
Verification-only (controls are built in Phases 2–7): security headers and full CSP verified in production preview; SSRF-safe fetch audit; rate-limit coverage audit; dependency audit; Lighthouse ≥ 95 on every route; `docs/compliance/HECVAT.md` mapped to 4.1.5 sections, data map, subprocessor list, incident-response outline; `ADMIN_GUIDE.md`, `UNIVERSITY_ONBOARDING.md`.
**DoD:** the checklist in `docs/BRIEF.md §6` fully ticked with evidence links; Lighthouse report committed.

### Phase 9 — Deploy + launch → **STOP: Vercel env vars incl. required Upstash + Turnstile keys, cron, optional custom domain**
Production env vars, cron (weekly digest + daily keep-alive ping), Supabase redirect URLs, Resend domain, Turnstile keys, analytics; launch checklist; final Playwright run against production with screenshots.
**DoD:** `docs/BRIEF.md §16` fully satisfied on the production URL.

## 5. Free-tier budget and upgrade triggers
| Resource | Free limit (verified 2026-09-15) | Design guard | Upgrade trigger |
|---|---|---|---|
| Supabase DB / storage / egress | 500 MB / 1 GB / 5 GB (+5 GB cached) | Text-first content; client downscale ≤ 1 MB then server re-encode to WebP ≤ 300 KB; per-user upload quota | Pro $25/mo when DB > 350 MB or a campus adopts officially (also removes pausing, adds backups) |
| Supabase pausing | 7 days low activity | Daily keep-alive Action against REST + real traffic; daily Vercel ping after launch | Pro removes pausing |
| Supabase backups | none on Free | Nightly age-encrypted `pg_dump` Action, 30-day retention | Pro adds daily backups (PITR add-on) |
| Supabase Realtime | 200 concurrent connections, 2M msgs/mo | Subscribe only on the inbox; polling fallback | Pro (500 connections) |
| Supabase active projects | 2 | One project (prod); local Docker for dev/CI | — |
| Resend | 100/day, 3,000/mo | Auth mail reserved first; weekly digest; relay mail counted | Pro $20/mo (daily digest becomes possible), or Brevo 300/day |
| Vercel Hobby | 100 GB transfer, 1M invocations, once-per-day cron, non-commercial | Static assets cached; one weekly digest cron + daily ping; donations allowed | Pro $20/seat when a university adopts it commercially |
| Upstash Redis | 500K commands/mo | ~1 command per protected mutation | Pay-as-you-go |
| Turnstile | 20 widgets, 10 hostnames each | One widget, one hostname | — |
| Groq | 30 RPM, 1K RPD (gpt-oss) | Per-campus daily AI quota; features opt-in | Dev tier |
| GitHub Actions | Unlimited on public repos | Cache pnpm store; Playwright on PRs + main; scheduled jobs need a commit every 60 days | — |

## 6. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Supabase Auth endpoints callable directly with the publishable key (bypassing form checks, burning the email quota) | Turnstile captcha inside Supabase Auth, auth email rate limits, domain allowlist enforced in the database (D-04) |
| Reserved JWT claim collision | Never write a `role` claim; only `university_id` is added; roles come from `memberships` |
| No backups on Free | Nightly encrypted `pg_dump` Action from Phase 2; accepted residual risk documented for HECVAT |
| Region is immutable after project creation | Region chosen at the Phase 2 STOP (closest to the pilot campus; Vercel function region matched) |
| Serwist Turbopack integration is rough | Bundler-agnostic SW build (esbuild) with a minimal precache scope |
| Supabase passkeys API changes (experimental) | Feature flag; magic link/OTP are primary; passkey code isolated in one module |
| Nonce CSP forces dynamic rendering | Acceptable for an auth-gated app; public pages are few; revisit with hash-based CSP if Lighthouse suffers |
| Free-tier email cap blocks auth mail | Send-budget guard reserves headroom for auth; digest is weekly and deferrable |
| TypeScript 7 (Go) ecosystem gaps | Pin the JS-based line `create-next-app` scaffolds; evaluate `tsgo` only for `typecheck` |
| Meal board misuse (resale) | No price fields; keyword block on money terms; flag OFF by default; policy text required; reports route to moderators |
| Anonymous-app harassment pattern | Verified identity, pseudonyms traceable by admins only, human moderation, appeals, no vanity karma |
| Graduates lose the university mailbox | Optional verified secondary email and passkey as recovery paths |
| Node 25 installed locally (EOL) | `.nvmrc` = 24 and `engines` enforced; instructions in README |

## 7. Owner decisions
| # | Question | Status |
|---|---|---|
| 1 | GitHub repo name and visibility | ✅ `campus-wide`, public (2026-09-16) |
| 2 | Licence | ✅ MIT (2026-09-16) |
| 3 | Domain | ✅ Vercel subdomain for now; an email-sending domain is needed before real sign-ups (D-17) |
| 4 | **Pilot campus** (name + email domain) | ⏳ open — a demo campus is seeded until named |
| 5 | **Supabase project region** (and matching Vercel function region) | ⏳ open — proposal: the region closest to the pilot campus; asked again at the Phase 2 STOP |
| 6 | Confirm D-14 (in-app double-blind relay instead of email-in/email-out) | ⏳ open — assumed accepted unless you object |
| 7 | Legal entity and jurisdiction placeholders | ⏳ stay as `[PLACEHOLDER]` until provided |

Reply "approved" (plus any changes) and Phase 1 starts.
