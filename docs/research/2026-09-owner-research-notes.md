# Owner research notes (September 2026)

> Supplied with the build brief on 2026-09-15. These notes explain *why* the brief chose what it
> chose. They are background, not requirements; requirements live in `docs/BRIEF.md`.
> Live-verified facts (versions, limits) are recorded separately in
> `docs/research/2026-09-15-stack-verification.md`.

## Stack selection
- Next.js 16.x is current stable (Turbopack default, React 19.2, React Compiler 1.0, Cache Components, stable Adapters API, minimum Node 20). Frequent coordinated security releases in 2026 — pin versions and keep Dependabot on.
- Tailwind CSS v4 (Oxide engine, CSS-first `@theme`, OKLCH, container queries); v4.1 current. No `tailwind.config.js` for most cases.
- Chosen stack: Next.js 16 + TypeScript (strict) + Tailwind v4 + Supabase (Postgres + RLS + Auth + Storage + Realtime) + Drizzle ORM + shadcn/ui. Decisive factor for multi-university: Postgres Row-Level Security gives database-enforced tenant isolation, and Supabase Auth integrates natively with RLS. Better Auth + Neon is the alternative only if leaving Supabase.
- Supabase free tier: 500 MB database, 1 GB storage, 5 GB egress, 50,000 MAU, 500,000 edge-function invocations, 200 concurrent Realtime connections, 2 active projects, no backups. Free projects pause after 7 days of inactivity; mitigation = GitHub Actions keep-alive cron.
- Vercel Hobby: 100 GB transfer, 1M function invocations, 1M edge requests, 6,000 build minutes/month. Hobby is personal, non-commercial use only; budget Vercel Pro ($20/mo/seat) for real university adoption.
- Resend free: 100 emails/day and 3,000/month, 3 domains, 30-day logs. The 100/day cap is the binding limit → batched digests; Brevo (300/day) as a swap option. Verify own domain (SPF/DKIM).
- AI free tiers: Gemini free (prompts used for training), Groq (no-training), Cerebras, OpenRouter, Cloudflare Workers AI. Prefer no-training providers server-side; keep AI opt-in and PII-free.

## Security
- OWASP Top 10:2025 (finalized Jan 2026): new A03 Software Supply Chain Failures and A10 Mishandling of Exceptional Conditions; A02 Security Misconfiguration #2; SSRF folded into A01 Broken Access Control.
- CVE-2025-29927 (CVSS 9.1, CWE-285): spoofed `x-middleware-subrequest` header bypassed middleware auth; fixed in 12.3.5 / 13.5.9 / 14.2.25 / 15.2.3. Lesson: authorize in a Data Access Layer + RLS, never middleware alone; strip the header at the edge.
- Passkeys/WebAuthn, magic links, OTP via Supabase Auth (exact support verified in the stack verification doc).
- Hipo `university-domains-list` (JSON + API) maps email domains → institution/country; use to seed tenant allowlists.

## Legal & compliance
- Meal-swipe resale is prohibited essentially everywhere (UNC, Rutgers, Penn, UChicago, UMass Boston, UNH, U Minnesota). Guest passes are only for treating a present guest. "Penn Swipe Market" drew a disciplinary notice in 2023. Product conclusion: no resale ever; gifting/treating + charitable donation only; per-campus admin toggle OFF by default; per-campus policy text and disclaimers.
- Marketplace without payments: no PCI scope; still needs prohibited-items list, scam/safety guidance, safe-exchange-zone guidance, and intermediary duties.
- Cookie consent: EU/UK require consent for non-essential cookies (UK ICO guidance 29 Apr 2026; CNIL narrow audience-measurement exemption; UK DUAA statistical exception from 5 Feb 2026). Path: strictly-necessary cookies only + cookieless analytics → no banner; Cookie Policy page; honor Global Privacy Control; consent mechanism reserved for optional cookies.
- ADA Title II web rule: WCAG 2.1 AA for public entities; deadlines extended by DOJ Interim Final Rule (Apr 20, 2026) to Apr 26, 2027 (≥50k pop.) and Apr 26, 2028 (<50k). Design to WCAG 2.2 AA (superset).
- European Accessibility Act applicable since Jun 28, 2025; EN 301 549 (WCAG 2.1 AA operative; v4.1.1 → WCAG 2.2 pending OJ citation). Microenterprise exemption (<10 employees and ≤€2M).
- EU DSA: all intermediaries regardless of size — Art. 16 notice-and-action, Art. 17 statement of reasons, Art. 18 criminal-offence notification, Arts. 11–12 points of contact, Art. 14 clear T&Cs. Micro/small exempt from Arts. 20–24 and Art. 15 reporting.
- UK Online Safety Act: illegal-content duties from 17 Mar 2025; children's-safety duties and age assurance from 25 Jul 2025; no blanket small-service exemption; name an accountable person.
- HECVAT 4.1.5 (Feb 10, 2025; EDUCAUSE/Internet2/REN-ISAC): one workbook, ~321 questions, 7 sections (Organization, Product, Infrastructure, IT Accessibility, Case-Specific, Artificial Intelligence, Privacy). Build SOC 2-aligned docs, a data map, and a subprocessor list up front.
- Section 230 still shields US platforms for UGC (Sept 2026). FERPA binds institutions and "school officials"; relevant only on formal university adoption.

## Zero-cost AI enhancements
- In-browser first: Transformers.js v3+ with WebGPU for (a) pre-post toxicity nudge (classification) and (b) semantic duplicate-question detection (embeddings — all-MiniLM/bge-small/mxbai). Chrome Prompt API / Gemini Nano is stabilizing (desktop only, ~4 GB) → progressive enhancement only. Always feature-detect; core flows never block.
- Server fallback (opt-in, PII-free): Groq/Gemini/OpenRouter for summaries, translation, mod-queue triage — human-in-the-loop only, never auto-ban.

## Product design
Anonymous campus apps (Yik Yak, Fizz, Sidechat) repeatedly produced harassment and weak moderation. Differentiators: identity-verified accountability (pseudonymous display names, privately traceable), helpfulness-first reputation (no vanity karma), structured post types with expiry, calm chronological-first feed with digests, strong human moderation with appeals.

## Design + PWA
shadcn/ui + Radix/Base UI; Tailwind v4 OKLCH semantic tokens; light/dark/system via next-themes; self-hosted variable fonts via next/font; subtle motion with reduced-motion support; mobile bottom nav + safe-area insets; desktop keyboard shortcuts. iOS Web Push only for home-screen-installed PWAs (iOS 16.4+); Serwist is the current Next.js PWA tooling. Prompt install before requesting notification permission; email as fallback.

## Claude Code practices
Lean CLAUDE.md; plan before edits; subagents for research; verify in a real browser (Playwright) at mobile + desktop; small conventional commits with green CI; fetch current library docs; never commit secrets; explicit STOP-and-ask checkpoints for accounts and API keys.
