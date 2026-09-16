# Campus Wide — Build Brief (source of truth)

> Original build brief supplied by the project owner on 2026-09-15. It is the authoritative
> statement of scope, principles, and checkpoints. PLAN.md, ROADMAP.md and ARCHITECTURE.md
> derive from it. When live documentation conflicts with a fact here, live docs win and the
> discrepancy is recorded in `docs/research/`.

You are the lead engineer building and shipping a production-quality, multi-tenant web platform called **Campus Wide**. Work autonomously, but follow the phased plan, verification gates, and STOP checkpoints exactly. **Before writing code for any library, fetch and read its current official docs** — do not rely on training memory, because the versions and limits below may have advanced since this prompt was written (target date: September 2026). When a fact below conflicts with live docs, trust live docs and tell me.

### 0. Project identity & mission
Campus Wide is a **multi-tenant platform that any university can adopt** to build a more helpful student community. Students verified by their university email can: share guest passes and **gift/treat** meals (never resell), post a **no-payment classifieds board**, ask and answer questions, post events, find study groups / roommates / rides, and run lost & found — a **calmer, kinder, identity-accountable alternative** to Reddit/Yik Yak/Fizz. Each university is an isolated tenant.

### 1. Non-negotiable principles
1. **Security first** — OWASP Top 10:2025 aware; authorization enforced in a **Data Access Layer AND Postgres RLS, never middleware-only** (remember CVE-2025-29927; strip `x-middleware-subrequest` at the edge).
2. **Privacy by design & data minimization** — student emails are never publicly exposed; student-to-student contact uses a **masked/double-blind email relay**; provide self-service data export + deletion (right to erasure).
3. **Accessibility** — target **WCAG 2.2 AA**; full keyboard support, reduced-motion, screen-reader tested.
4. **Mobile-first AND desktop-optimized**, fully responsive, PWA-installable.
5. **Fresh, distinctive design** — deliberately avoid the generic AI-template look.
6. **Ease of use** — excellent empty states, onboarding, minimal friction.
7. **Free tier only** — prefer open-source/self-hostable; document upgrade paths and free-tier limits inline.
8. **Ship in small, verified, conventional commits with green CI.**

### 2. Recommended stack (verify current versions before installing)
- **Next.js 16 (App Router, RSC, Server Actions, Turbopack) + TypeScript (strict) + React 19.**
- **Tailwind CSS v4** (CSS-first `@theme`, OKLCH tokens, container queries) + **shadcn/ui** (with Radix/Base UI primitives).
- **Supabase**: Postgres + **Row-Level Security**, Supabase Auth (magic link + OTP + passkeys), Storage, Realtime, Edge Functions.
- **Drizzle ORM** (typed schema + migrations) alongside the Supabase client.
- **Resend** for transactional email (magic links, verification, contact relay, digests).
- **Zod** validation; **next-themes** for light/dark/system; **Serwist** for the PWA/service worker.
- **Cookieless analytics** (self-hosted Umami or Plausible, or PostHog EU free) so no cookie banner is required.
- **Upstash Redis** free tier for rate limiting; **Cloudflare Turnstile** free for bot protection.
- **AI**: **Transformers.js (WebGPU)** in-browser first; Chrome **Prompt API / Gemini Nano** as progressive enhancement; **Groq / Gemini / OpenRouter** free tiers as opt-in, PII-free server fallback (prefer no-training providers).

### 3. Repository & workflow setup
- Initialize git; use the **`gh` CLI** to create the repo under my GitHub account (**STOP: confirm repo name + visibility with me first**).
- Add `.gitignore`, `.env.example` (never commit `.env`), conventional-commit tooling, **GitHub Actions CI** (typecheck, lint, Vitest, Playwright, build), **Dependabot**, **CodeQL**, **gitleaks** secret scanning, **branch protection on `main`**, `SECURITY.md` + `/.well-known/security.txt`, issue/PR templates, and `CODEOWNERS`.
- Add a **Supabase keep-alive GitHub Action** (cron ~every 5 days) to prevent free-tier project pausing (free projects pause after 7 days of inactivity).
- Wire Vercel deploy from the repo (**STOP: I must link the account + set env vars**). Enable preview deployments. Note: Vercel Hobby is non-commercial only — flag when Pro may be required.

### 4. Architecture — multi-tenant data model (initial schema; refine as needed)
Every domain row carries `university_id`, and **RLS policies enforce tenant isolation on every table**. Tables:
`universities`, `university_domains` (verified email domains, seeded from the Hipo university-domains-list), `users`, `profiles` (pseudonymous display name; real identity retained privately), `roles`/`memberships` (student / staff / alumni / moderator / university_admin), `spaces` (dorm / major / club / class-year) + `space_memberships`, `posts` (type enum: `question`, `event`, `offer`, `ask`, `marketplace`, `meal_share`, `lost_found`, `ride`, `study_group`, `roommate`, `poll`; optional `expires_at`), `listings`, `meal_shares`, `events`, `rsvps`, `comments`/`answers` (with accepted-answer flag), `reactions` (Thank-you / Helped), `reports`, `moderation_actions`, `appeals`, `feedback`, `notifications`, `blocks`, `mutes`, `consent_records`, `policy_versions`, `audit_log`, `contact_relays` (masked email threads).
Write **cross-tenant isolation tests** proving one university cannot read another's rows.

### 5. Auth & verification flows
- Sign up **only** with an allowlisted university email domain → map user to the correct tenant; unknown domains queue for admin review.
- Support **magic link + OTP**, offer **passkeys**; architect for optional future SSO (SAML/OIDC — Shibboleth/InCommon, Microsoft Entra ID, Google Workspace for Education).
- Age attestation (17/18+ or per-jurisdiction). Session management + device list + "sign out everywhere." Secure account recovery.

### 6. Security requirements checklist
RLS on all tables; DAL-based authorization; Zod input validation + output encoding; **CSP with nonces**, HSTS, Referrer-Policy, Permissions-Policy, COOP; CSRF-safe Server Actions; rate limiting (Upstash) + Turnstile; secure uploads (image re-encode, MIME sniff, size caps); SSRF-safe outbound fetches; strip `x-middleware-subrequest`; encryption at rest (Supabase) + strict PII minimization; **audit logging**; supply-chain hygiene (committed lockfile, npm provenance, Dependabot/CodeQL/gitleaks); secrets only in Vercel env vars.

### 7. Compliance & legal — implement as real functionality
Write real, thorough documents (with `[PLACEHOLDER]`s like `[LEGAL ENTITY NAME]`/`[JURISDICTION]` and a prominent "**This is not legal advice — have a lawyer review**" banner): **Privacy Policy, Terms of Service, Cookie Policy, Community Guidelines / Acceptable Use Policy, Marketplace Safety & Prohibited Items Policy, Meal Sharing Policy, DMCA/Copyright Policy + designated agent, Accessibility Statement, Security Policy + security.txt, Data Processing Addendum template for universities, Subprocessor list, Children's/Age Policy, DSA Transparency / Content-Moderation Report template, Law-Enforcement Request Policy.**
Implement:
- **Consent ledger**: signup displays the policies and captures **granular, versioned** consent (policy version, timestamp, IP hash, user agent, per-checkbox state) in `consent_records`. Marketing-email opt-in is separate from required terms.
- **Re-consent flow** when a policy version bumps (forces acceptance at next login). Downloadable copy of accepted terms.
- **Self-service data export + account deletion.**
- **Honor the Global Privacy Control** signal; strictly-necessary cookies only + cookieless analytics (no intrusive banner, but keep a Cookie Policy page).
- **DSA baseline**: notice-and-action reporting on every post/comment, statement-of-reasons on every moderation action, and a public point-of-contact page.

### 8. Feature modules (ALL per-campus admin-configurable)
- **Feed**: chronological-first, optional "most helpful" sort, **no infinite doomscroll by default**; digest emails.
- **Questions & Answers**: accepted answers; **in-browser semantic duplicate detection** (Transformers.js embeddings) suggests existing answers before a user posts.
- **Events**: RSVP + **`.ics` calendar export**; optional AI-assisted event creation from pasted text.
- **Marketplace (NO payments)**: **masked email relay** with "reveal on mutual interest," safety tips, prohibited-items list, "meet at campus safe-exchange zone." No payment processing (keeps PCI scope out).
- **Guest Pass & Meal Gifting board — LEGALLY SAFE DESIGN**: gifting/treating a present friend + charitable donation only. **Absolutely NO resale/sale/trade of meal swipes, dining dollars, or guest passes** (this is prohibited by essentially every university dining contract and has led to student discipline). **Admin toggle OFF by default**, with per-campus editable policy text + disclaimers, and a Swipe-It-Forward-style donation pathway.
- **Lost & Found, Ride share, Study groups, Roommate/sublet, Polls** — each with tailored fields, filters, and expiry.
- **Moderation**: report, mute, block, trusted-student moderators, audit log, appeal flow; a **pre-post toxicity nudge that runs in-browser** (no data leaves the device); optional AI triage of the mod queue is **human-in-the-loop only, never auto-ban**.
- **University admin portal**: configure campus, domains, features, policies, moderators; view **aggregate, non-PII** analytics; verify a new campus via its admin email domain.
- **Public "campus stats" page.**
- **Reputation**: "helped N people," Thank-you reactions, accepted answers — **no vanity karma**.

### 9. Vercel-style feedback widget
A small **"Feedback"** button in the top-right of the header opens a popover with a textarea and **four emoji sentiment options**, submits to the `feedback` table with page URL + user-agent (with consent), optionally forwards to a **GitHub Issue** via the GitHub API or to the admin email, and shows a thank-you state.

### 10. Design system & UX
Light/dark/system via next-themes; an OKLCH brand palette with semantic tokens in `@theme`; self-hosted variable fonts via next/font; subtle motion (View Transitions / Motion) respecting `prefers-reduced-motion`; **mobile bottom navigation + safe-area insets**; desktop keyboard shortcuts; polished empty states. **Performance budgets: Lighthouse ≥ 95 in all categories; green Core Web Vitals.** PWA: web app manifest, icons, offline shell (Serwist), install prompt shown **before** requesting notification permission; Web Push where supported (note the iOS requirement that the PWA be installed to the home screen).

### 11. AI enhancements (progressive, privacy-preserving)
In-browser first, feature-detected, never blocking core flows: duplicate-question detection (embeddings), the pre-post toxicity nudge (classification), and optional summaries/translation via the Prompt API or an opt-in server free-tier model. **Clearly label anything that leaves the device; keep PII out of all server AI calls.**

### 12. Testing & quality gates
Vitest (unit), Playwright (E2E + visual at **mobile 390px and desktop 1440px**), axe/Lighthouse/Pa11y accessibility checks, typecheck + ESLint. **CI must be green before merge.**

### 13. Phased milestone plan (write PLAN.md + ROADMAP.md first; each phase has a Definition of Done)
- **Phase 0 — Planning**: write PLAN.md, ROADMAP.md, ARCHITECTURE.md, and a task checklist; confirm all stack versions from live docs. **DoD: I approve the plan.**
- **Phase 1 — Repo + CI + skeleton**: repo, CI, Dependabot/CodeQL/gitleaks, base app, theme system, design tokens. **STOP: I create/confirm the GitHub repo name + access.**
- **Phase 2 — Auth + multi-tenant + RLS**: Supabase schema, RLS policies, Drizzle migrations, university-domain verification, consent ledger. **STOP: I create Supabase + Resend accounts, provide keys, and verify the email sending domain.**
- **Phase 3 — Core content**: posts/comments/reactions/spaces/feed, questions & answers.
- **Phase 4 — Modules**: events + .ics, marketplace + masked relay, meal gifting (toggle off), lost & found, rides, study groups, polls.
- **Phase 5 — Moderation + admin portal + feedback widget.**
- **Phase 6 — AI enhancements (progressive).**
- **Phase 7 — Legal docs + compliance functionality + accessibility pass + PWA.**
- **Phase 8 — Hardening + tests + performance + HECVAT-readiness docs.**
- **Phase 9 — Deploy to Vercel + launch checklist. STOP: I link Vercel, set env vars, optionally add a custom domain.**

### 14. STOP-and-ask checkpoints
Pause and give me **exact, numbered instructions** whenever I must: create accounts (GitHub, Vercel, Supabase, Resend, Upstash, Cloudflare Turnstile, analytics), obtain/enter API keys, verify an email sending domain, or buy a domain. Otherwise proceed autonomously and keep committing.

### 15. Documentation to produce
`README`, `CONTRIBUTING`, `SECURITY.md`, `ARCHITECTURE.md`, `ADMIN_GUIDE.md`, `UNIVERSITY_ONBOARDING.md`, `PLAN.md`, `ROADMAP.md`, and **HECVAT-readiness notes** (map controls to **HECVAT 4.1.5** sections — Organization, Product, Infrastructure, IT Accessibility, Case-Specific, Artificial Intelligence, Privacy — plus a data map, subprocessor list, and incident-response outline).

### 16. Final delivery checklist
Green CI; Lighthouse ≥ 95; RLS verified with cross-tenant tests; consent + export + deletion working; all legal docs present; feedback widget live; PWA installable; deployed to Vercel; secrets only in env vars; README explains full setup. **Verify the running app in Playwright at mobile and desktop viewports and attach screenshots.**
