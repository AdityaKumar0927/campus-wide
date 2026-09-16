# Campus Wide — Roadmap

Milestones map 1:1 to the phases in `PLAN.md`. Effort is given in working sessions (one session ≈ a
focused half-day of autonomous build + verification), not calendar dates, because STOP checkpoints
depend on the owner. Status legend: ✅ done · 🔄 in progress · ⏳ blocked on owner · ⬜ not started.

| Milestone | Phase | Outcome the owner can see | Effort | Status |
|---|---|---|---|---|
| M0 Plan approved | 0 | Plan, architecture, task list, verified versions, audit; public repo with Dependabot + ruleset | 1 | ⏳ owner approval of the plan |
| M1 Skeleton live in CI | 1 | Green CI, themed empty app at 390/1440 px, Lighthouse ≥ 95, owner look review; Vercel previews (recommended STOP) | 2 | ⬜ |
| M2 Sign in to your campus | 2 | Magic link/OTP sign-up with a seeded domain, hardened auth, consent ledger, RLS isolation suite, keep-alive + encrypted backups | 3 | ⏳ Supabase project (region) + Resend; email domain or test mode |
| M2b Passkeys beta | 2b | Optional passkey sign-in behind a flag | 1 | ⬜ |
| M3 Ask and answer | 3 | Feed, Q&A with accepted answers, reactions, spaces, search, inbox, weekly digest, uploads + rate limits | 3 | ⬜ |
| M4 Campus modules | 4 | Events + .ics, marketplace + in-app relay + safe-exchange spots, meal gifting (off), lost & found, rides, study groups, roommates, polls | 4 | ⬜ |
| M5 Safe community | 5 | Reports, moderation with statements of reasons, appeals, admin portal, campus stats, feedback widget | 3 | ⬜ |
| M6 Helpful AI | 6 | Duplicate-question hints and toxicity nudge in-browser; opt-in summaries | 2 | ⬜ |
| M7 Compliant and installable | 7 | 14 policy docs, export/deletion, GPC, WCAG 2.2 AA pass, PWA + push | 3 | ⬜ |
| M8 Verified hardening | 8 | Security checklist with evidence, Lighthouse ≥ 95 everywhere, HECVAT readiness docs | 2 | ⬜ |
| M9 Launched | 9 | Production on Vercel with required Upstash + Turnstile keys, launch checklist, screenshots | 1 | ⏳ Vercel env vars |

## Pilot definition
"Pilot-ready" = **M1–M5, M7, M8, and M9** on one seeded campus, with the meal board off, moderation
staffed by at least two trusted students, an email-sending domain verified, and the owner's legal
placeholders filled in. Real students never use a build that has not passed M8 verification. M6 is
required before a second campus is onboarded.

## After launch (not scheduled)
- SAML/OIDC SSO per campus (Supabase Pro; Shibboleth/InCommon, Entra ID, Google Workspace).
- Custom domain per campus and campus-branded themes.
- Daily digest (needs Resend Pro or Brevo), Markdown in posts, richer search.
- Internationalisation (message catalogues; translation via opt-in server AI).
- Inbound-email relay (true email-to-email masking) once verified against Resend inbound docs.
- Declarative Web Push for iOS 18.4+ and richer notification preferences.
- Paid-tier migrations when triggered: Supabase Pro (pausing, backups, size), Vercel Pro (commercial use), Resend Pro (volume).
- HECVAT 4.1.5 full workbook submission and a SOC 2-aligned controls narrative when a university requests it.

## Owner-facing checkpoints (in order)
1. ✅ Repo (`campus-wide`, public), licence (MIT), domain (Vercel subdomain) — 2026-09-16.
2. Approve the plan; name the pilot campus; confirm D-14 (in-app relay). → unlocks M1
3. (Recommended, end of Phase 1) Link the GitHub repo in Vercel for preview deployments.
4. Create the Supabase project (**choose the region**) and a Resend account; paste keys; decide on an email domain or accept owner-only test mode. → unlocks M2
5. **Required before launch:** Upstash Redis and Cloudflare Turnstile keys. Optional any time: Umami (analytics), Groq / OpenRouter (server AI).
6. Set Vercel env vars, cron, optional custom domain. → unlocks M9
