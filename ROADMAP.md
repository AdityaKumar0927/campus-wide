# Campus Wide — Roadmap

Milestones map 1:1 to the phases in `PLAN.md`. Effort is given in working sessions (one session ≈ a
focused half-day of autonomous build + verification), not calendar dates, because STOP checkpoints
depend on the owner. Status legend: ✅ done · 🔄 in progress · ⏳ blocked on owner · ⬜ not started.

| Milestone | Phase | Outcome the owner can see | Effort | Status |
|---|---|---|---|---|
| M0 Plan approved | 0 | This plan, architecture, task list, verified versions | 1 | ✅ (awaiting approval) |
| M1 Skeleton live in CI | 1 | Public repo, green CI, themed empty app at 390/1440 px, Lighthouse ≥ 95 | 2 | ⏳ repo name + visibility |
| M2 Sign in to your campus | 2 | Magic link/OTP sign-up with a seeded domain, consent ledger, RLS isolation suite green | 3 | ⏳ Supabase + Resend accounts |
| M2b Passkeys beta | 2b | Optional passkey sign-in behind a flag | 1 | ⬜ |
| M3 Ask and answer | 3 | Feed, Q&A with accepted answers, reactions, spaces, search, digest | 3 | ⬜ |
| M4 Campus modules | 4 | Events + .ics, marketplace + relay, meal gifting (off), lost & found, rides, study groups, roommates, polls | 4 | ⬜ |
| M5 Safe community | 5 | Reports, moderation with statements of reasons, appeals, admin portal, campus stats, feedback widget | 3 | ⬜ |
| M6 Helpful AI | 6 | Duplicate-question hints and toxicity nudge in-browser; opt-in summaries | 2 | ⬜ |
| M7 Compliant and installable | 7 | 14 policy docs, export/deletion, GPC, WCAG 2.2 AA pass, PWA + push | 3 | ⬜ |
| M8 Hardened | 8 | Security checklist with evidence, Lighthouse ≥ 95 everywhere, HECVAT readiness docs | 2 | ⬜ |
| M9 Launched | 9 | Production on Vercel, launch checklist, screenshots | 1 | ⏳ Vercel link + env vars |

## Pilot definition
"Pilot-ready" = M1–M5 + M7 on one seeded campus, with the meal board off, moderation staffed by at least
two trusted students, and the owner's legal placeholders filled in. M6 and M8 are required before a
second campus is onboarded.

## After launch (not scheduled)
- SAML/OIDC SSO per campus (Supabase Pro; Shibboleth/InCommon, Entra ID, Google Workspace).
- Custom domain per campus and campus-branded themes.
- Internationalisation (message catalogues; translation via opt-in server AI).
- Inbound-email relay (true email-to-email masking) once verified against Resend inbound docs.
- Declarative Web Push for iOS 18.4+ and richer notification preferences.
- Paid-tier migrations when triggered: Supabase Pro (pausing, backups, size), Vercel Pro (commercial use), Resend Pro (volume).
- HECVAT 4.1.5 full workbook submission and a SOC 2-aligned controls narrative when a university requests it.

## Owner-facing checkpoints (in order)
1. Approve plan; choose repo name, visibility, licence, pilot campus. → unlocks M1
2. Create Supabase project + Resend account; verify sending domain; paste keys. → unlocks M2
3. (Optional, any time) Upstash, Turnstile, Umami accounts. → rate limiting, bot protection, analytics go live
4. Link Vercel, set env vars, optional custom domain. → unlocks M9
