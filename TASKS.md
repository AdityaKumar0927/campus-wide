# Campus Wide — Task checklist

Live checklist; tick as work lands. Detail is finest for the next two phases and coarser after.

## Phase 0 — Planning
- [x] Verify package versions, free-tier limits, and platform capabilities from official sources (2026-09-15)
- [x] Write `docs/BRIEF.md`, `docs/research/*`, `AGENTS.md`, `.gitignore`, `.gitattributes`
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
- [x] Owner look review rounds 3-4 (2026-09-17): slimmer 400-weight headlines, seal restored at hero scale, working feature previews with sample data
- [x] Design v5 (2026-09-17): owner rejected mono uppercase kickers and the "notice board for the whole campus" line → sans sentence-case labels, tab-glyph kickers, washi tape label; own SVG set (module icons, campus-object icons for the cloud, tape strips, spot illustrations, hand-ruled section line) replaces library icons; `CLAUDE.md` → `AGENTS.md`; screenshots in `docs/screenshots/phase-2d/`
- [ ] **Owner look review (round 5)** of `docs/screenshots/phase-2d/`
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
- [x] Posts (type enum + Zod payloads, plain text + links), comments/answers, accepted answer, thank-you reactions; counters and identity set by triggers (2026-09-18)
- [x] Spaces + memberships (seeded defaults, member-created); feed (newest / active / most helpful, page links, never infinite); Questions view (open / all); Postgres FTS via `search_posts`
- [x] Notifications written only by `app.notify()`; inbox with one Realtime channel while open + 60 s polling fallback; unread badge in the shell; weekly digest (`/api/cron/digest`, Monday 14:00 UTC) behind the `email_sends` daily budget (skipped, never lost, without Resend)
- [x] Upload pipeline: browser downscale to WebP ≤ 1 MB → `post-images` bucket (RLS on the campus folder, 1 MB cap, image MIME only); no avatars by pilot design (no photos of people). Server re-encode deferred: Next serves the public bucket URL directly
- [x] Rate limits in Postgres (D-22): posts 10/h (3/h in the first week), comments 30/h (10/h), reactions 60/h
- [x] RLS suite extended (29 tests); E2E ask → answer → accept → thank and feed paging (`tests/e2e/content.spec.ts`)
- [ ] Owner look review of `docs/screenshots/phase-3/`

## Phase 4 — Modules
- [x] Events (RSVP via `post_participants`, `.ics` at `/p/[id]/calendar.ics`), Marketplace (price/condition/category, prohibited-items check on both sides, safe-exchange spots, double-blind relay with the one-message rule, payment-word cautions, mutual reveal through `relay_contact()`, thread export for reports, block freezes the thread, "it happened" credits the helper) (2026-09-18)
- [x] Meal gifting (flag OFF, `audience = meal_holders` for private requests visible to attested holders only, per-term self-attestation + meal-sharing consent recorded before every offer, no price fields), Lost & found (claim through the relay), Rides (seats enforced), Study groups (capacity), Roommates (expiry, relay), Polls (`poll_votes`, private ballots, `poll_results()`)
- [x] Feature flags enforced in the database (`app.type_enabled`) and mirrored in the composer, sidebar, and module pages; `pg_cron` hourly `app.expire_posts()` plus a daily `/api/cron/expire` backstop
- [x] RLS suite: 37 tests; E2E: relay (leak assertions on rendered HTML), events + calendar file, polls, expiry sweep, meals switched off, at both viewports
- [ ] Owner look review of `docs/screenshots/phase-4/`

## Phase 5 — Moderation, admin, feedback
- [x] Reports on notices, replies, threads, and profiles with DSA categories and automatic evidence snapshots (`file_report`), case numbers and a status page, urgent contacts shown first; mute, block (silent, total, freezes threads; three blocks in a week alert moderators); moderator queue, decisions through `moderate()` with a statement of reasons (facts, ground, automated: false, redress) delivered to the subject; appeals once within 14 days, decided by a different moderator (`decide_appeal`), overturn restores; suspensions lift on schedule; audit log page (2026-09-19)
- [x] Admin portal: modules on/off (database-enforced), campus details, policy text, safe-exchange spots, email domains, moderators and admins, member lookup, aggregate numbers, feedback
- [x] Public campus numbers at `/campus/[slug]` (groups under ten hidden); Feedback popover stores to `feedback` and forwards to a GitHub issue or the admin mailbox when configured
- [x] RLS suite: 46 tests; E2E: report → decision → appeal → overturn, admin flag toggle, feedback persisted
- [ ] New-campus self-verification via admin email domain (Phase 9, with the second campus)
- [ ] Owner look review of `docs/screenshots/phase-5/`

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
