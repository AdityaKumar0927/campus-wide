# Campus Wide — working agreement for Claude Code

Multi-tenant, university-verified student community platform. Read in this order:
`docs/BRIEF.md` (scope, source of truth) → `PLAN.md` (phases + Definitions of Done) →
`ARCHITECTURE.md` → `TASKS.md` (live checklist). Owner-supplied background is in `docs/research/`.

## Rules that never bend
- **Tenant isolation is enforced in Postgres RLS *and* in the Data Access Layer (`src/lib/dal/`).** Never trust `proxy.ts`/middleware alone for authorization (CVE-2025-29927). Every domain table carries `university_id`.
- **No secrets in git.** Real values live in `.env.local` (ignored) and Vercel env vars. Keep `.env.example` current.
- **Fetch official docs before using a library API**; versions are pinned in `package.json` and recorded in `docs/research/`.
- **Meal gifting board: gifting/treating and donation only. No resale, sale, or trade of meal credits, ever.** Feature flag defaults OFF per campus.
- **No payments, no PII in server-side AI calls, no auto-ban.** AI moderation is human-in-the-loop.
- **Student emails are never exposed publicly.** Contact goes through the masked relay.

## Workflow
- Package manager: **pnpm 12** (corepack). Runtime: **Node 24 LTS** (`.nvmrc`); Node 25 is EOL and unsupported on Vercel.
- Small **conventional commits** (`feat:`, `fix:`, `chore:`, `docs:`, `test:`); CI must be green before merging to `main`.
- Before claiming a UI change works, verify it in Playwright at **390px** and **1440px**.
- **STOP checkpoints** (accounts, API keys, repo creation, domain verification, deploy linking): pause and give the owner exact numbered instructions. Everything else: proceed autonomously.
- Update `TASKS.md` as work lands; keep `PLAN.md` phase status current.

## Commands (populated in Phase 1)
`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:e2e` · `pnpm build`
