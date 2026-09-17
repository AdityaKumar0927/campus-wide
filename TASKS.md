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
- [x] Install Node 24 LTS (fnm) and pnpm 12 via corepack; `.nvmrc`, `engines`, pnpm minimum-release-age + trust policy
- [x] `create-next-app@latest` (TS strict, Tailwind v4, App Router, `src/`, React Compiler), versions pinned
- [x] shadcn init (Base UI), 15 base components
- [x] `.env.example`, `.editorconfig`, commitlint + Husky, `CODEOWNERS`, issue/PR templates
- [x] Expand `README.md`; `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `/.well-known/security.txt` (LICENSE ✓)
- [x] GitHub Actions CI (commitlint, typecheck, lint, Vitest, audit, build, Playwright 390/1440 + axe + Linux screenshot baselines, Lighthouse report, artifacts)
- [x] `dependabot.yml` (npm + actions, grouped weekly), CodeQL, gitleaks workflows
- [ ] Ruleset upgrade: require CI checks + pull request before merge (after the first green PR)
- [x] `proxy.ts`: nonce CSP (unit-tested builder), security headers in `next.config.ts`, defence-in-depth header drop; session refresh lands in Phase 2
- [x] Theme per D-18: OKLCH `@theme` tokens, next-themes, self-hosted Instrument Sans + Newsreader (display: optional), reduced-motion base
- [x] Shell: header with Feedback popover (local thank-you state), theme menu, mobile bottom nav (safe-area), desktop sidebar + `?` shortcuts, empty states, `/offline`, 404, placeholder sections
- [x] `/api/health`; 7 unit + 16 E2E tests green; Lighthouse a11y/best-practices/SEO = 100, performance 93-95 mobile / 81-83 desktop on localhost (simulator artifact, see `scripts/lighthouse.mjs`; re-verified on the Vercel preview); screenshots in `docs/screenshots/phase-1/`
- [x] Owner look review 2026-09-17: v1 judged clean but soulless → D-18 revised to the notice-board direction
- [x] Board motion (CSS-only scroll reveal + "recently pinned" ticker, reduced-motion safe) and a board-styled Open Graph card (`src/app/opengraph-image.tsx`, Instrument Serif OFL); Magic UI Pro template reviewed and not copied (licence), its MDX pipeline noted for Phase 7
- [x] Magic UI (MIT registry) used creatively: animated-beam → twine relay diagram ("Take a tab" section), highlighter → marker pen, spinning-text → rubber-stamp seal, canvas-confetti → paper scraps on feedback, theme wipe via View Transitions; reduced-motion safe
- [x] Owner look review round 2 (2026-09-17): serif and italics rejected → Bricolage Grotesque + Manrope, tight tracking; Chicago map hero with live ripple; dock, orbiting circles, icon cloud, comic text added
- [ ] **Owner look review (round 3)** of `docs/screenshots/phase-2/` and `phase-2-motion/`
- [x] Vercel project `campus-wide` created and linked via CLI (2026-09-16); production live at https://campus-wide.vercel.app with `ENABLE_EXPERIMENTAL_COREPACK=1` (pnpm 12) and `APP_URL`
- [x] Vercel GitHub app installed by the owner (2026-09-17); PR previews and production deploys are automatic
- [x] Footer static/external links are plain anchors (fixed a prefetch 404; best-practices 100 on production)
- [x] Production Lighthouse (2026-09-16): mobile 97/97/100 performance, accessibility 100, SEO 100, best-practices 96-100; desktop performance 86-93 (observed LCP 0.3 s; simulator attributes JS to the text paint) → Phase 8 task below

## Phase 2 — Auth, multi-tenancy, RLS, consent
- [x] Illinois Tech research (dining, identity, safety, policy) and pilot design: `docs/pilot/illinois-tech.md` (2026-09-17)
- [x] Supabase CLI + local stack (Docker); Drizzle schema for tenancy/identity/consent/audit with RLS; helper + hook + trigger migrations; Illinois Tech seed
- [x] Integration test suite against the local stack (`pnpm test:rls`): OTP sign-up via Mailpit, hook rejection, declared name, isolation (14 tests)
- [x] Sign-in (code + magic link), onboarding (declared name, age, house rules → consent ledger), settings (sessions, privacy mode, sign out everywhere), session-aware shell; proxy refresh + redirects; E2E signs in through the real UI
- [x] CI runs the local Supabase stack and the integration tests
- [x] Supabase project created by the owner via the Vercel Marketplace (us-east-1), connected to the `campus-wide` Vercel project; migrations + seed applied to production 2026-09-17
- [ ] STOP: Supabase Auth configuration on the production project (hooks, OTP template, site/redirect URLs) — needs the dashboard or a personal access token
- [ ] Deferred by owner: Cloudflare Turnstile and Resend + sending domain (production codes use the Supabase built-in mailer, 2 per hour, until then)
- [x] Vercel GitHub app installed; pushes to `main` deploy automatically (2026-09-17)
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
- [ ] Desktop performance ≥ 95: JS diet for public pages (drop Sonner/Base UI menus from the public layout) and evaluate static rendering of public pages with a hash-based CSP once Next SRI leaves experimental
- [ ] `docs/compliance/HECVAT.md`, data map, subprocessors, incident response; `ADMIN_GUIDE.md`, `UNIVERSITY_ONBOARDING.md`

## Phase 9 — Deploy
- [ ] STOP: Vercel env vars (Upstash + Turnstile required), cron (weekly digest, daily ping), Supabase redirect URLs, Resend domain, analytics
- [ ] Launch checklist (`docs/BRIEF.md §16`); production Playwright run + screenshots
