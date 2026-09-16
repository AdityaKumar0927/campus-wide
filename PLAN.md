# Campus Wide — Delivery Plan

**Status:** Phase 0 complete, awaiting owner approval · **Date:** 2026-09-15 · **Owner:** Aditya Kumar (AdityaKumar0927)
**Source of truth:** `docs/BRIEF.md`. Verified versions/limits: `docs/research/2026-09-15-stack-verification.md`.
**Live checklist:** `TASKS.md`. **Milestones:** `ROADMAP.md`. **System design:** `ARCHITECTURE.md`.

## 1. What we are building
A multi-tenant web platform any university can adopt. Verified students (university email) get a calm, identity-accountable community: feed, Q&A with accepted answers, events with RSVP/.ics, a no-payment marketplace with a masked email relay, a gifting-only meal board (off by default), lost & found, rides, study groups, roommates, polls, human-first moderation with appeals, a university admin portal, real compliance functionality (consent ledger, export, deletion, DSA notice-and-action), and privacy-preserving in-browser AI helpers. Free tier everywhere; upgrade paths documented.

## 2. Verified stack (pinned in Phase 1)
Next.js **16.3.5** (App Router, RSC, Server Actions, Turbopack, `proxy.ts`) · React **19.3** · TypeScript (JS-based line as scaffolded; TS 7 native compiler evaluated later) · Tailwind **4.3** · shadcn CLI **4.21** (Base UI primitives) · Supabase (Postgres + RLS, Auth, Storage, Realtime) via `@supabase/ssr` **0.12** / `supabase-js` **2.116** · Drizzle ORM **0.45** + drizzle-kit **0.31** · Resend **6.28** + React Email · Zod **4.6** · next-themes **0.4.6** · Serwist **9.5** (core lib) · Vitest **5** · Playwright **1.63** + axe · ESLint **10** · Transformers.js **4.2** · Upstash ratelimit **2.1** · Turnstile · motion **13**. Runtime: **Node 24 LTS**, **pnpm 12**.

## 3. Decisions (with rationale)
| # | Decision | Why |
|---|---|---|
| D-01 | **Node 24 LTS + pnpm 12 (corepack)**; `.nvmrc`/`engines` enforced | Node 25 (installed locally) is EOL since 2026-06 and not offered by Vercel; vitest 5 and supabase-js 2.116 require Node ≥22. |
| D-02 | **Authorization lives in the Data Access Layer + Postgres RLS.** `proxy.ts` only refreshes the session cookie, strips `x-middleware-subrequest`, adds nonce/security headers, and redirects unauthenticated users for UX. | CVE-2025-29927 lesson; Next 16 renamed middleware → proxy (Node runtime). Both layers are tested: RLS via cross-tenant SQL tests, DAL via unit tests. |
| D-03 | **Tenant-implicit routing.** A user belongs to exactly one university (from verified email). Authenticated routes never carry the tenant in the URL; the DAL derives it from the session's membership. Only public pages use `/campus/[slug]`. | Removes an entire class of URL-tampering bugs; no wildcard DNS needed on Vercel Hobby. Custom domains per campus can be layered on later. |
| D-04 | **Auth = magic link + 6-digit email OTP (primary); passkeys as a feature-flagged beta**; SAML/OIDC SSO designed-for, not built. | Supabase passkeys are public beta (2026-05-28), API marked experimental; MFA is TOTP/phone only. SSO waits for a paying campus. |
| D-05 | **Schema + migrations in Drizzle; RLS policies live in the same Drizzle schema files** (`pgPolicy`, `.enableRLS()`) so policies are versioned with tables; Supabase local (Docker) runs the RLS test-suite in CI. | One source of truth; policy drift is caught by tests, not by incident. |
| D-06 | **Email via Resend configured as Supabase Auth custom SMTP** (smtp.resend.com:465) for magic-link/OTP mail, with Supabase email templates customised (`{{ .Token }}` for OTP). The Send-Email auth hook is the upgrade path for React Email templates. All non-auth email is **batched into digests** behind a daily send-budget guard. | Supabase built-in mailer is 2 messages/hour, best-effort; Resend free = 100/day; auth mail must never be starved by digests. |
| D-07 | **PWA with the Serwist core library, compiled by esbuild in a `prebuild` script** (bundler-agnostic). `@serwist/turbopack` is the fallback. | `@serwist/next` is webpack-only; Turbopack is the Next 16 default and its Serwist support still has open runtime bugs. |
| D-08 | **Analytics = Umami Cloud Hobby (cookieless) by default**, PostHog EU as the alternative; script injected only when the env var is set. | Plausible has no free hosted tier. Cookieless analytics + strictly-necessary cookies = no consent banner (Cookie Policy page still shipped). |
| D-09 | **Server-side AI = Groq (default), OpenRouter `:free` (secondary). Gemini free tier excluded by default.** All server AI is opt-in per campus and per user, PII-stripped, labelled "leaves your device". | Groq contractually does not train on inputs and offers zero-data-retention; Gemini's unpaid tier trains on content. |
| D-10 | **Recommend a public GitHub repository** (owner decides at the Phase 1 STOP). | Public repos get free CodeQL, secret scanning, and unlimited Actions minutes; private repos lose CodeQL without a paid license. |
| D-11 | **Rate limiting = Upstash Redis sliding window on mutations and auth endpoints; in-memory fallback in dev** | 500K commands/month is ample if we spend ~1 command per protected mutation. |
| D-12 | **Hosting = Vercel Hobby for the pilot; Pro the moment a university adopts it for production.** | Hobby is non-commercial only; donations are explicitly allowed. |
| D-13 | **Meal board is gifting/treating + donation only, admin toggle OFF by default, per-campus policy text required before enabling.** | Resale is prohibited by dining contracts everywhere; students have been disciplined for it. |
| D-14 | **No payments anywhere.** Marketplace contact = double-blind relay with reveal-on-mutual-interest. | Keeps PCI out of scope; protects student emails. |
| D-15 | **Design to WCAG 2.2 AA**, verified with axe in Playwright + manual keyboard/screen-reader passes. | Superset of ADA Title II (WCAG 2.1 AA) and EN 301 549. |

## 4. Phases and Definitions of Done
Each phase ends with green CI, updated docs, and ticks in `TASKS.md`. **STOP** = owner action required; I pause with numbered instructions.

### Phase 0 — Planning ✅ (this document)
Deliverables: `PLAN.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `TASKS.md`, `CLAUDE.md`, `docs/BRIEF.md`, `docs/research/*`.
**DoD:** owner approves the plan and answers the Phase 1 questions (repo name, visibility, licence).

### Phase 1 — Repo, CI, skeleton, design system → **STOP first: repo name + visibility**
- Install Node 24 LTS + pnpm 12 (corepack); `create-next-app@latest` (TypeScript strict, Tailwind v4, App Router, `src/`, Turbopack); shadcn init (Base UI primitives).
- Repo hygiene: `.env.example`, `.nvmrc`, `.editorconfig`, commitlint + Husky (conventional commits), `CODEOWNERS`, issue/PR templates, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`.
- GitHub: `gh repo create`; branch protection on `main` (required checks, no force-push); Dependabot (npm + actions, weekly, grouped); CodeQL (public repo); gitleaks; Supabase keep-alive workflow (cron every 5 days → `/api/health`, which runs one cheap query).
- CI: install → typecheck → lint → Vitest → build → Playwright (chromium at 390 px and 1440 px) with axe; reports and screenshots uploaded as artifacts.
- App skeleton: root layout, `proxy.ts` (session refresh, strip `x-middleware-subrequest`, nonce + security headers), theme provider (light/dark/system), OKLCH `@theme` tokens, self-hosted variable fonts, mobile bottom nav + desktop sidebar shell, empty-state components, Feedback button stub, `/.well-known/security.txt`, `/api/health`.
- **DoD:** CI green on `main`; Lighthouse ≥ 95 on the skeleton at both viewports; screenshots attached; README quick-start works from a clean clone.

### Phase 2 — Auth, multi-tenancy, RLS, consent → **STOP first: Supabase project + Resend domain**
- Supabase CLI as a dev dependency; `supabase start` locally (Docker) and in CI. Drizzle schema for every table in `docs/BRIEF.md §4`, each with `university_id` and RLS policies (`pgPolicy` + `drizzle-orm/supabase` roles); migrations committed.
- Tenant resolution: `university_domains` seeded from the Hipo list (MIT); signup only for allowlisted domains; unknown domain → `domain_requests` queue; membership created by a `SECURITY DEFINER` function on first sign-in.
- Auth: magic link + email OTP (`signInWithOtp`), Resend custom SMTP, cookie sessions via `@supabase/ssr` with `getClaims()` in proxy and DAL; device/session list + sign out everywhere; age attestation at signup.
- Consent ledger: `policy_versions` + `consent_records` (version, timestamp, IP hash, UA, per-checkbox); re-consent gate on version bump; downloadable copy of accepted terms.
- Data Access Layer `src/lib/dal/*`: every query takes the caller session and scopes by tenant; unit-tested.
- **Cross-tenant isolation suite** (Vitest against local Supabase): for every table, a user of university X cannot read or write university Y rows via anon, authenticated, or forged-JWT paths.
- Phase 2b (feature flag): passkeys beta (`auth.experimental.passkey`) register / sign in / manage.
- **DoD:** isolation suite green in CI; new user signs up with a seeded domain, consents, lands in their campus; unknown domain is queued; export and deletion endpoints scaffolded.

### Phase 3 — Core content
Posts (one table, type enum, type-specific JSONB validated by a Zod schema per type), comments/answers with accepted answer, Thank-you/Helped reactions, spaces + memberships, chronological feed with a "most helpful" toggle and paged (never infinite) loading, Q&A views, Postgres full-text search, notifications table + in-app inbox, daily digest job (Vercel cron, once per day on Hobby) behind the Resend send-budget guard.
**DoD:** E2E ask → answer → accept → thank; feed paging; digest rendered and budget-guarded; isolation suite extended to new tables.

### Phase 4 — Modules
Events (RSVP, `.ics` export), Marketplace (listings, prohibited-items check, safety tips, **double-blind relay** with reveal-on-mutual-interest), Meal Gifting (**flag OFF**, per-campus policy text required before enabling, gifting/treating + donation pathway, no price fields exist), Lost & Found, Rides, Study groups, Roommate/sublet, Polls; expiry sweeper via Supabase `pg_cron`.
**DoD:** every module has create / list / detail / expire E2E coverage at both viewports; the relay never leaks an address (asserted on rendered HTML and on the outgoing mail payload).

### Phase 5 — Moderation, admin portal, feedback widget
Report (DSA notice-and-action categories), mute, block, moderator queue, actions with a **statement of reasons**, appeals, audit log, trusted-student moderator role; university admin portal (campus settings, domains, feature flags, policy text, moderators, aggregate non-PII analytics, new-campus verification via admin email domain); public campus stats page; Feedback popover (four sentiments, page URL + UA with consent, optional GitHub Issue forwarding).
**DoD:** report → action → statement of reasons → appeal E2E; admin can toggle every module; feedback lands in the DB and optionally in GitHub.

### Phase 6 — AI enhancements (progressive)
In-browser (Transformers.js + WebGPU, feature-detected, web worker, lazy): duplicate-question suggestions (mxbai-embed-xsmall or all-MiniLM embeddings) and the pre-post toxicity nudge (toxic-bert). Chrome Prompt API (`LanguageModel`, Chrome 148+, desktop only) for optional summaries/rewrites. Opt-in server fallback via Groq for thread summaries, translation, and mod-queue triage (labels only; a human decides). Every server call is PII-stripped and labelled.
**DoD:** all AI features degrade to no-ops without WebGPU/Prompt API; no core flow waits on a model download; tests cover the no-AI path.

### Phase 7 — Legal docs, compliance functionality, accessibility, PWA
All 14 policy documents as MDX with `[PLACEHOLDER]`s and the not-legal-advice banner, versioned in `policy_versions`; Global Privacy Control honoured; Cookie Policy page; DSA point-of-contact page; export (JSON zip) + deletion (soft-delete then purge job); WCAG 2.2 AA pass (axe in CI plus manual keyboard and screen-reader pass); PWA (manifest, icons, Serwist offline shell, install prompt before notification permission, Web Push with email fallback).
**DoD:** axe reports zero violations on every route at both viewports; PWA installs on Android, iOS, and desktop; export and deletion verified E2E.

### Phase 8 — Hardening, tests, performance, HECVAT readiness
Security headers verified (CSP nonces, HSTS, COOP, Referrer-Policy, Permissions-Policy); upload pipeline (MIME sniff, re-encode with `sharp`, size caps); SSRF-safe fetch helper; rate limits on every mutation; dependency audit; Lighthouse ≥ 95 on every route; `docs/compliance/HECVAT.md` mapped to 4.1.5 sections, data map, subprocessor list, incident-response outline; `ADMIN_GUIDE.md`, `UNIVERSITY_ONBOARDING.md`.
**DoD:** the checklist in `docs/BRIEF.md §6` fully ticked with evidence links; Lighthouse report committed.

### Phase 9 — Deploy + launch → **STOP: link Vercel, set env vars, optional custom domain**
Vercel project, preview deployments, env vars, cron, keep-alive verified, Supabase redirect URLs, Resend domain, Turnstile keys, analytics; launch checklist; final Playwright run against production with screenshots.
**DoD:** `docs/BRIEF.md §16` fully satisfied on the production URL.

## 5. Free-tier budget and upgrade triggers
| Resource | Free limit (verified 2026-09-15) | Design guard | Upgrade trigger |
|---|---|---|---|
| Supabase DB / storage / egress | 500 MB / 1 GB / 5 GB (+5 GB cached) | Text-first content; images re-encoded to WebP ≤ 300 KB; per-user upload quota | Pro $25/mo when DB > 350 MB or a campus adopts officially (also removes pausing, adds backups) |
| Supabase pausing | 7 days low activity | GitHub Actions keep-alive every 5 days + real traffic | Pro removes pausing |
| Supabase active projects | 2 | One project (prod). Local Docker for dev/CI. A second project only for staging if needed | — |
| Resend | 100/day, 3,000/mo | Auth mail has priority; digests batched, capped, deferred when budget is low; relay mail counted | Pro $20/mo, or Brevo (300/day) swap |
| Vercel Hobby | 100 GB transfer, 1M invocations, once-per-day cron, non-commercial | Static assets cached; one daily digest cron; donations allowed | Pro $20/seat when a university adopts it commercially |
| Upstash Redis | 500K commands/mo | ~1 command per protected mutation; in-memory fallback in dev | Pay-as-you-go |
| Turnstile | 20 widgets, 10 hostnames each | One widget, one hostname | — |
| Groq | 30 RPM, 1K RPD (gpt-oss) | Per-campus daily AI quota; features opt-in | Dev tier |
| GitHub Actions | Unlimited on public repos (2,000 min/mo private) | Cache pnpm store; Playwright only on PRs + main | Public repo |

## 6. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Serwist Turbopack integration is rough | Bundler-agnostic SW build (esbuild); PWA is Phase 7 so core is never blocked |
| Supabase passkeys API changes (experimental) | Feature flag; magic link/OTP are primary; passkey code isolated in one module |
| Nonce CSP forces dynamic rendering | Acceptable for an auth-gated app; public pages are few; revisit with hash-based CSP if Lighthouse suffers |
| Free-tier email cap blocks auth mail | Send-budget guard reserves headroom for auth; digests defer |
| TypeScript 7 (Go) ecosystem gaps | Pin the JS-based line `create-next-app` scaffolds; evaluate `tsgo` only for `typecheck` |
| Meal board misuse (resale) | No price fields; keyword/regex block on money terms; flag OFF by default; policy text required; reports route to moderators |
| Anonymous-app harassment pattern | Verified identity, pseudonyms traceable by admins only, human moderation, appeals, no vanity karma |
| Node 25 installed locally (EOL) | `.nvmrc` = 24 and `engines` enforced; instructions in README |

## 7. Questions for the owner (answer with the approval)
1. **GitHub repo name and visibility.** Proposal: `campus-wide`, **public** (free CodeQL + unlimited Actions minutes). Say "private" if you prefer, and CodeQL will be replaced by Semgrep OSS.
2. **Licence.** Proposal: MIT. Alternatives: AGPL-3.0 (forces forks to share source) or "all rights reserved" (no LICENSE file).
3. **Pilot campus.** Which university (and email domain) should be seeded first so the demo is realistic?
4. **Product name / domain.** "Campus Wide" as the display name; do you already own a domain for email sending (Resend needs DNS access)?
5. **Legal entity and jurisdiction placeholders.** These stay as `[PLACEHOLDER]` unless you provide them.

Reply "approved" (plus any changes) and I start Phase 1.
