# Campus Wide — Task checklist

Live checklist; tick as work lands. Detail is finest for the next two phases and coarser after.

## Phase 0 — Planning
- [x] Verify package versions from the npm registry and official docs
- [x] Verify free-tier limits (Supabase, Vercel, Resend, Upstash, Turnstile, analytics, AI, GitHub)
- [x] Verify platform capabilities (Supabase SSR/passkeys/SMTP, Drizzle RLS, Transformers.js, Prompt API, Web Push, CSP, CVE mitigation, Hipo list, Vercel cron)
- [x] Write `docs/BRIEF.md`, `docs/research/*`, `CLAUDE.md`, `.gitignore`
- [x] Write `PLAN.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `TASKS.md`
- [x] Initial commit on `main` (local only; remote created in Phase 1)
- [x] Owner decisions recorded 2026-09-16: MIT licence (D-16), Vercel subdomain for now (D-17)
- [ ] **Owner approval** of the plan; pilot campus not yet named (a demo campus is seeded until then)

## Phase 1 — Repo, CI, skeleton, design system
- [x] Repo created: https://github.com/AdityaKumar0927/campus-wide (public), `main` pushed 2026-09-16
- [ ] Install Node 24 LTS (nvm-windows or winget) and pnpm 12 via corepack; add `.nvmrc`, `engines`
- [ ] `create-next-app@latest` (TS strict, Tailwind v4, App Router, `src/`), pin versions
- [ ] shadcn init (Base UI), base components (button, input, dialog, popover, sheet, tabs, toast)
- [ ] `.env.example`, `.editorconfig`, commitlint + Husky, `CODEOWNERS`, issue/PR templates
- [ ] `README.md` (expand), `CONTRIBUTING.md`, `SECURITY.md`, `/.well-known/security.txt` (LICENSE ✓ 2026-09-16)
- [ ] GitHub Actions CI (typecheck, lint, Vitest, build, Playwright 390/1440 + axe, artifacts)
- [ ] Dependabot (npm + actions, grouped weekly), CodeQL, gitleaks workflows
- [ ] Supabase keep-alive workflow (cron every 5 days → `/api/health`)
- [ ] Branch protection on `main` (required checks, linear history, no force-push)
- [ ] `proxy.ts`: strip `x-middleware-subrequest`, nonce, security headers, session refresh stub
- [ ] Theme: OKLCH `@theme` tokens, next-themes, self-hosted variable fonts, reduced-motion base
- [ ] Shell: header with Feedback stub, mobile bottom nav (safe-area), desktop sidebar, empty states, `/offline` placeholder
- [ ] `/api/health` route; Vitest + Playwright smoke tests; Lighthouse ≥ 95 at both viewports; screenshots

## Phase 2 — Auth, multi-tenancy, RLS, consent
- [ ] STOP: Supabase project (URL, publishable key, secret key, DB URLs) + Resend (API key, verified domain)
- [ ] Supabase CLI dev dependency; `supabase init`; `supabase start` locally and in CI (Docker)
- [ ] Drizzle config (`provider: supabase`, roles), schema for all tables with `university_id` + `pgPolicy`
- [ ] SQL helpers: `app.current_university_id()`, `app.has_role()`; custom access token hook adds claims
- [ ] Seed `university_domains` from Hipo JSON (script + committed subset for CI)
- [ ] Sign-up flow: domain check → `signInWithOtp` (magic link + OTP) → callback → membership trigger
- [ ] Resend custom SMTP in Supabase; OTP template with `{{ .Token }}`; branded templates
- [ ] Unknown domain → `domain_requests` + review UI stub
- [ ] Consent gate: `policy_versions`, `consent_records`, re-consent on bump, download accepted copy
- [ ] Sessions page: device list, sign out everywhere; age attestation in onboarding
- [ ] DAL modules with unit tests; Server Actions call DAL only
- [ ] RLS isolation suite: anon / authenticated / forged-claim paths for every table
- [ ] Export + deletion endpoints scaffolded (jobs land in Phase 7)
- [ ] Phase 2b: passkeys beta behind a flag

## Phase 3 — Core content
- [ ] Posts (type enum + Zod payloads), comments/answers, accepted answer, reactions
- [ ] Spaces + memberships; feed (chronological, "most helpful", paged); Q&A views
- [ ] Postgres FTS; notifications + inbox + Realtime; daily digest cron + send-budget guard
- [ ] E2E: ask → answer → accept → thank; RLS suite extended

## Phase 4 — Modules
- [ ] Events + RSVP + `.ics`; Marketplace + prohibited-items + relay (double-blind, mutual reveal)
- [ ] Meal gifting (flag OFF, policy text gate, no price fields); Lost & found; Rides; Study groups; Roommates; Polls
- [ ] `pg_cron` expiry sweeper; E2E per module at both viewports; relay leak tests

## Phase 5 — Moderation, admin, feedback
- [ ] Reports (DSA categories), mute, block, queue, actions + statement of reasons, appeals, audit log
- [ ] Admin portal (settings, domains, flags, policy text, moderators, non-PII analytics, campus verification)
- [ ] Public campus stats; Feedback popover (4 sentiments, consent, optional GitHub Issue)

## Phase 6 — AI
- [ ] Transformers.js worker (WebGPU/WASM), duplicate-question hints, toxicity nudge
- [ ] Prompt API adapter (Chrome 148+); Groq opt-in server path + PII scrubber + quotas; no-AI path tests

## Phase 7 — Legal, compliance, accessibility, PWA
- [ ] 14 policy MDX docs with placeholders + banner; policy versioning; DSA contact page; Cookie Policy
- [ ] GPC handling; export (JSON zip) + deletion (soft → purge); WCAG 2.2 AA pass (axe + manual)
- [ ] PWA: manifest, icons, Serwist SW via esbuild, offline shell, install prompt, Web Push + email fallback

## Phase 8 — Hardening + HECVAT
- [ ] Headers verified; upload pipeline; safeFetch; rate limits everywhere; audit; Lighthouse ≥ 95 all routes
- [ ] `docs/compliance/HECVAT.md`, data map, subprocessors, incident response; `ADMIN_GUIDE.md`, `UNIVERSITY_ONBOARDING.md`

## Phase 9 — Deploy
- [ ] STOP: Vercel link, env vars, cron, optional domain; Supabase redirect URLs; Turnstile + analytics keys
- [ ] Launch checklist (`docs/BRIEF.md §16`); production Playwright run + screenshots
