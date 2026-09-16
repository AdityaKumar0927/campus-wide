# Campus Wide — Task checklist

Live checklist; tick as work lands. Detail is finest for the next two phases and coarser after.

## Phase 0 — Planning
- [x] Verify package versions, free-tier limits, and platform capabilities from official sources (2026-09-15)
- [x] Write `docs/BRIEF.md`, `docs/research/*`, `CLAUDE.md`, `.gitignore`, `.gitattributes`
- [x] Write `PLAN.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `TASKS.md`
- [x] Repo created: https://github.com/AdityaKumar0927/campus-wide (public), `main` pushed 2026-09-16
- [x] Owner decisions recorded 2026-09-16: MIT licence (D-16), Vercel subdomain for now (D-17)
- [x] Independent audit of the planning set + GitHub settings (`docs/audits/2026-09-16-phase0-audit.md`); fixes applied
- [x] GitHub: Dependabot alerts + security updates on, ruleset `protect-main` (no force-push/deletion), squash/rebase only, wiki/projects off
- [ ] **Owner approval** of the plan; name the pilot campus; confirm D-14 (in-app relay)

## Phase 1 — Repo, CI, skeleton, design system
- [ ] Install Node 24 LTS (version manager) and pnpm 12 via corepack; add `.nvmrc`, `engines`, pnpm minimum-release-age
- [ ] `create-next-app@latest` (TS strict, Tailwind v4, App Router, `src/`), pin versions
- [ ] shadcn init (Base UI), base components (button, input, dialog, popover, sheet, tabs, toast)
- [ ] `.env.example`, `.editorconfig`, commitlint + Husky, `CODEOWNERS`, issue/PR templates
- [ ] Expand `README.md`; `CONTRIBUTING.md`, `SECURITY.md`, `/.well-known/security.txt` (LICENSE ✓)
- [ ] GitHub Actions CI (typecheck, lint, Vitest, build, Playwright 390/1440 + axe + screenshot baselines, artifacts)
- [ ] `dependabot.yml` (npm + actions, grouped weekly), CodeQL, gitleaks workflows
- [ ] Ruleset upgrade: require CI checks + pull request before merge
- [ ] `proxy.ts`: session refresh stub, nonce, security headers, defence-in-depth header drop
- [ ] Theme per D-18: OKLCH `@theme` tokens, next-themes, self-hosted sans + serif display fonts, reduced-motion base
- [ ] Shell: header with Feedback stub, mobile bottom nav (safe-area), desktop sidebar, empty states, `/offline` placeholder
- [ ] `/api/health`; smoke tests; Lighthouse ≥ 95 at both viewports; screenshots; **owner look review**
- [ ] STOP (recommended): owner links the repo in Vercel for preview deployments

## Phase 2 — Auth, multi-tenancy, RLS, consent
- [ ] STOP: Supabase project (**region**, URL, publishable + secret keys, DB URLs) + Resend (API key; domain or test mode)
- [ ] Verify before building: before-user-created hook and Postgres custom-access-token hook on Free; `auth.sessions` columns; pgvector + pg_cron on Free
- [ ] Supabase CLI dev dependency; `supabase init`; `supabase start` locally and in CI (Docker)
- [ ] Drizzle config (`provider: supabase`, roles), schema for all tables with `university_id` + `pgPolicy`; pgvector
- [ ] SQL helpers: `app.current_university_id()` (JWT claim), `app.has_role()` (membership lookup); custom access token hook adds `university_id` only
- [ ] Domain allowlist enforced in DB (hook or BEFORE INSERT trigger); membership trigger on `email_confirmed_at`
- [ ] Seed `university_domains` from Hipo JSON + demo campus (script + committed subset for CI)
- [ ] Sign-up flow: domain check → `signInWithOtp` (magic link + OTP) → callback → consent → onboarding (age attestation)
- [ ] Supabase Auth hardening: Turnstile captcha, auth email rate limits; Resend custom SMTP; OTP template with `{{ .Token }}`
- [ ] Unknown domain → `domain_requests` + review UI stub
- [ ] Consent ledger: `policy_versions`, `consent_records`, separate marketing opt-in, re-consent on bump, download copy
- [ ] Sessions page (SECURITY DEFINER over `auth.sessions`), sign out everywhere, secondary recovery email
- [ ] DAL modules with unit tests; Server Actions call DAL only; Upstash rate limits on auth actions (fail closed in prod)
- [ ] Keep-alive Action (daily, Supabase REST via secrets); nightly age-encrypted `pg_dump` Action (30-day artifacts)
- [ ] RLS isolation suite: anon / authenticated / forged-claim paths for every table
- [ ] Export + deletion endpoints scaffolded
- [ ] Phase 2b: passkeys beta behind a flag

## Phase 3 — Core content
- [ ] Posts (type enum + Zod payloads, plain text + links), comments/answers, accepted answer, reactions
- [ ] Spaces + memberships; feed (chronological, "most helpful", paged); Q&A views; Postgres FTS
- [ ] Notifications + inbox (Realtime only on inbox, polling fallback); weekly digest cron + send-budget guard
- [ ] Upload pipeline (client downscale → server re-encode) with avatars; rate limits on every mutation
- [ ] E2E: ask → answer → accept → thank; RLS suite extended

## Phase 4 — Modules
- [ ] Events + RSVP + `.ics`; Marketplace + prohibited items + safe-exchange locations + in-app relay (mutual reveal)
- [ ] Meal gifting (flag OFF, policy gate, kinds, no price fields); Lost & found; Rides; Study groups; Roommates; Polls
- [ ] `pg_cron` expiry sweeper; E2E per module at both viewports; relay leak tests

## Phase 5 — Moderation, admin, feedback
- [ ] Reports (DSA categories), mute, block, queue, actions + statement of reasons, appeals, audit log
- [ ] Admin portal (settings, domains, flags, policy text, safe-exchange spots, moderators, non-PII analytics, campus verification)
- [ ] Public campus stats; Feedback popover (4 sentiments, consent, GitHub Issue or admin email)

## Phase 6 — AI
- [ ] Transformers.js worker (WebGPU/WASM, download gating), `posts.embedding` + `match_questions` RPC, toxicity nudge
- [ ] Prompt API summarise (Chrome 148+); Groq opt-in (summaries, translation, triage labels, paste-to-event) + PII scrubber + quotas; no-AI path tests

## Phase 7 — Legal, compliance, accessibility, PWA
- [ ] 14 policy MDX docs with placeholders + banner; policy versioning; DSA contact page; Cookie Policy
- [ ] GPC handling; export (JSON zip); deletion (anonymise content, purge identity, 30-day purge); WCAG 2.2 AA pass
- [ ] PWA: manifest, icons, Serwist SW via esbuild (small precache), offline page, install prompt, Web Push + email fallback

## Phase 8 — Hardening verification + HECVAT
- [ ] Verify headers + full CSP on a preview; SSRF and rate-limit coverage audits; Lighthouse ≥ 95 all routes
- [ ] `docs/compliance/HECVAT.md`, data map, subprocessors, incident response; `ADMIN_GUIDE.md`, `UNIVERSITY_ONBOARDING.md`

## Phase 9 — Deploy
- [ ] STOP: Vercel env vars (Upstash + Turnstile required), cron (weekly digest, daily ping), Supabase redirect URLs, Resend domain, analytics
- [ ] Launch checklist (`docs/BRIEF.md §16`); production Playwright run + screenshots
