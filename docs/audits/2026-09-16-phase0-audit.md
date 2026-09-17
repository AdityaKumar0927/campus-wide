# Phase 0 audit — 2026-09-16

Scope: the planning set (`PLAN.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TASKS.md`, `AGENTS.md`) against
`docs/BRIEF.md`, plus the GitHub repository configuration. No application code exists yet, so there is
no code, dependency, or runtime audit; those start in Phase 1 (CodeQL, gitleaks, `pnpm audit`, Playwright + axe).
Method: one independent reviewer agent cross-read every document against the brief; the lead audited the
repository via the GitHub API and re-checked the verified facts in `docs/research/2026-09-15-stack-verification.md`.

## 1. Owner decisions recorded today
| Decision | Value | Recorded in |
|---|---|---|
| Licence | MIT | `LICENSE`, PLAN D-16 |
| Domain | Vercel subdomain for now (`campus-wide.vercel.app` is unassigned as of today) | PLAN D-17 |
| Pilot campus | not yet named → a demo campus is seeded until then | TASKS Phase 0 |

## 2. GitHub repository audit
| Check | Before | After | Note |
|---|---|---|---|
| Visibility | public | public | Owner default accepted; CodeQL and Actions minutes are free |
| Licence file | none | MIT | |
| README | none | added | Landing page for the public repo |
| Dependabot alerts | disabled | **enabled** | |
| Dependabot security updates | disabled | **enabled** | Version-update PRs need `dependabot.yml` (Phase 1) |
| Secret scanning + push protection | enabled | enabled | GitHub default for public repos |
| Secret scanning: non-provider patterns | disabled | disabled | Requires a paid Secret Protection licence; gitleaks in CI covers generic patterns |
| Branch protection on `main` | none | **ruleset `protect-main`**: block deletion, block force-push | Required status checks and PR review are added in Phase 1 once CI exists |
| Merge methods | merge, squash, rebase | squash + rebase only; delete branch on merge; auto-merge allowed | Keeps linear, conventional history |
| Wiki / Projects | on | off | Smaller surface; docs live in-repo |
| Commit signing / provenance | n/a | — | Consider signed commits via SSH key in Phase 1 (optional) |

## 3. Lead findings and fixes (applied in commit 8e4782d)
| # | Severity | Finding | Fix |
|---|---|---|---|
| L1 | high | **Email sending needs a domain you control.** With only a Vercel subdomain, Resend cannot verify SPF/DKIM, so magic links to real students cannot be sent from production. Local dev is unaffected (Supabase mail catcher). | Recorded as D-17 with the consequence; Phase 2 STOP now includes "domain or accept test-mode (owner-only recipient)". |
| L2 | medium | `AGENTS.md` said "Node ≥ 20 LTS" while the verified stack requires Node ≥ 22.12 (vitest 5, supabase-js) and the plan chose Node 24. | Fixed to Node 24 LTS. |
| L3 | medium | Brief §8 asks for "optional AI-assisted event creation from pasted text"; the phase plan had dropped it. | Added to Phase 6. |
| L4 | medium | Brief §6 lists "encryption at rest (Supabase)" and "npm provenance"; the security-controls table had neither. | Added Encryption and Dependency-freshness rows to ARCHITECTURE §10. |
| L5 | low | Brief §3 wires Vercel deploy early ("Enable preview deployments"); the plan deferred all Vercel work to Phase 9, losing preview URLs for eight phases. | Added an optional Phase 1 exit STOP to link Vercel for previews. |
| L6 | low | Repository had no licence, README, Dependabot, or ruleset. | See §2. |

## 4. Independent reviewer findings and disposition
The reviewer agent returned 35 findings. Disposition: **fixed** = documents changed in this commit; **accepted** = recorded as a design change or risk; **verify** = checked before the phase that needs it (listed in TASKS); **owner** = needs the owner's call.

| # | Sev | Finding (condensed) | Disposition |
|---|---|---|---|
| 13 | high | JWT `role` claim would collide with the reserved PostgREST claim and break every query | **fixed** — only `university_id` is added to the JWT; roles are read from `memberships` (ARCH §3) |
| 21 | high | Supabase Auth endpoints reachable with the publishable key bypass the form-side domain check and Turnstile, allowing OTP spam that burns the 100/day email cap | **fixed** — Turnstile inside Supabase Auth, auth email rate limits, domain allowlist enforced in the database (D-04, ARCH §4) |
| 15 | med | Keep-alive cron targeted the app, which is not deployed until Phase 9; GitHub also disables schedules after 60 idle days | **fixed** — daily Action calls Supabase REST directly from Phase 2; Vercel ping added post-launch; idle-schedule note (ARCH §9) |
| 22 | med | Rate limiting was fail-open (in-memory fallback is useless across serverless instances) | **fixed** — fails closed in production; Upstash + Turnstile keys required at launch (D-11) |
| 14 | med | Stripping `x-middleware-subrequest` inside proxy cannot mitigate CVE-2025-29927 | **fixed** — real mitigations named; strip kept as defence in depth only (D-02, ARCH §10) |
| 16 | med | CSP omitted directives Phase 6 needs (`wasm-unsafe-eval`, `worker-src blob:`, model/Turnstile/Umami hosts) | **fixed** — full directive set enumerated (ARCH §10) |
| 23 | med | Pilot definition put students on the platform before Phase 8 hardening and without deploy | **fixed** — pilot = M1–M5 + M7 + M8 + M9; controls built in-phase, Phase 8 is verification (ROADMAP) |
| 24 | med | No backups on Supabase Free; consent and audit data unrecoverable | **fixed** — nightly age-encrypted `pg_dump` Action from Phase 2 (ARCH §9) |
| 25 | med | Vercel not linked until Phase 9; no previews for eight phases | **fixed** — recommended STOP at Phase 1 exit |
| 26 | med | Supabase region never chosen; immutable and drives GDPR/DSA answers | **owner** — added as decision 5 in PLAN §7 and to the Phase 2 STOP |
| 1 | med | In-app relay silently replaced the brief's email relay | **owner** — disclosed in D-14; assumed accepted unless the owner objects |
| 8 | med | AGENTS.md said Node ≥ 20 | **fixed** (earlier commit) |
| 2 | low | AI event creation from pasted text missing | **fixed** (Phase 6) |
| 3 | low | Safe-exchange zones and guest-pass kind missing from the model | **fixed** — `safe_exchange_locations`, `meal_shares.kind` (ARCH §3, §6) |
| 4 | low | No design direction for the "fresh, distinctive" requirement | **fixed** — D-18 "campus editorial" + owner look review in Phase 1 DoD |
| 5 | low | No visual baselines; Pa11y absent | **fixed** — `toHaveScreenshot` baselines; Pa11y deliberately not added (same engine) |
| 6 | low | Small brief items dropped (provenance, Edge Functions, admin-email feedback, marketing opt-in, field CWV, Groq key checkpoint) | **fixed** — each added (ARCH §1, §10, §14; PLAN Phase 2/5; ROADMAP checkpoint 5) |
| 7 | low | No storage for question embeddings | **fixed** — `posts.embedding vector(384)` + RPC (ARCH §6, §11) |
| 9 | low | Status lines still said repo pending | **fixed** (PLAN §7, ROADMAP) |
| 10 | low | Purge cadence, settings location, digest wording inconsistent | **fixed** — daily purge, explicit columns, "transactional vs digest" wording |
| 11 | low | `.enableRLS()` vs verified `withRLS` | **fixed** (D-05, ARCH §5) |
| 12 | low | Membership trigger fired on insert (before email verification) | **fixed** — trigger on `email_confirmed_at` (ARCH §4) |
| 17 | low | `prebuild` SW cannot precache hashed build output | **fixed** — small precache scope + runtime caching (D-07, ARCH §12) |
| 18 | verify | No supabase-js API lists a user's own sessions | **verify** — SECURITY DEFINER over `auth.sessions` noted; columns checked in Phase 2 |
| 19 | verify | Free-plan availability of auth hooks unverified | **verify** — Phase 2 pre-build check in TASKS |
| 20 | verify | React `<ViewTransition>` experimental | **fixed** — use `document.startViewTransition` directly (ARCH §13) |
| 27 | low | 5 MB originals would exhaust egress | **fixed** — client downscale ≤ 1 MB first (ARCH §10) |
| 28 | low | Daily digest impossible past ~80 users on 100/day | **fixed** — weekly digest; daily is an upgrade trigger (D-06) |
| 29 | low | Realtime 200-connection cap unbudgeted | **fixed** — inbox-only subscription + budget row |
| 30 | low | Graduates lose the only sign-in mailbox | **fixed** — secondary verified email + passkey recovery (ARCH §4) |
| 31 | low | Erasure semantics undefined | **fixed** — anonymise content, purge identity (Phase 7) |
| 32 | low | Role from JWT delays demotion | **fixed** — membership lookup (ARCH §3) |
| 33 | low | toxic-bert is heavy for mobile | **fixed** — download gating; smaller classifier evaluated in Phase 6 |
| 34 | low | Scope creep: FTS, Markdown, "make kinder" rewrite | **partly accepted** — Markdown and AI rewrite dropped; Postgres FTS kept (cheap, needed for a Q&A product) |
| 35 | low | In-app relay is a bigger build than an email relay | **owner** — tied to finding 1 |

## 5. Residual items for the owner
1. Name the pilot campus (email domain) so seeding and the demo are realistic.
2. Choose the Supabase region at the Phase 2 STOP (closest to the pilot campus).
3. Confirm the in-app relay design (D-14) or ask for email-in/email-out instead.
4. Plan for an email-sending domain (~$10/year) before real sign-ups; the Vercel subdomain cannot carry DNS records.

## 6. Verdict
The planning set is complete against the brief, internally consistent after this pass, and the two
high-severity design errors are corrected before any code depends on them. The plan is ready for approval.
