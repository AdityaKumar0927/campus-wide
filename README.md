# Campus Wide

A multi-tenant community platform any university can adopt. Students verified by their
university email get a calmer, kinder, identity-accountable space: questions and answers,
events, a no-payment marketplace with masked contact, a gifting-only meal board, lost and
found, rides, study groups, roommates, and polls, with human-first moderation and real
privacy and compliance functionality. Each university is an isolated tenant enforced by
Postgres Row-Level Security.

**Status:** Phase 1 (skeleton, design system, CI) — see [ROADMAP.md](ROADMAP.md). Sign-in and
content arrive in Phases 2 and 3; today the app is a themed shell with working navigation.

## Quick start

Prerequisites: **Node 24 LTS** (the repo pins it in `.nvmrc`; use [fnm](https://github.com/Schniz/fnm)
or nvm) and **pnpm 12** via corepack. Node 25 is end-of-life and is not supported.

```bash
corepack enable && corepack prepare pnpm@12.4.2 --activate
pnpm install                 # supply-chain policies live in pnpm-workspace.yaml
cp .env.example .env.local   # nothing is required for Phase 1
pnpm dev                     # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (eslint-config-next) |
| `pnpm test` | Vitest unit tests |
| `pnpm build` then `pnpm test:e2e` | Playwright at 390 px and 1440 px with axe accessibility checks; visual baselines are Linux-only and produced by CI |
| `pnpm build` then `pnpm lighthouse:server` | Lighthouse budget at mobile and desktop (starts and stops the server for you) |

## How the repository is organised

| Read | For |
|---|---|
| [PLAN.md](PLAN.md) | decisions, phases, Definitions of Done, free-tier budget, risks |
| [ARCHITECTURE.md](ARCHITECTURE.md) | tenancy, auth, authorization (DAL + RLS), data model, security controls |
| [ROADMAP.md](ROADMAP.md) · [TASKS.md](TASKS.md) | milestones and the live checklist |
| [docs/BRIEF.md](docs/BRIEF.md) | the original build brief (source of truth) |
| [docs/research/](docs/research/) · [docs/audits/](docs/audits/) | versions and limits verified against official docs; audit reports |
| [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) | how to contribute; how to report a vulnerability |

```
src/app/(public)   landing, offline, later: policies and campus stats
src/app/(app)      the signed-in shell: feed and module sections
src/proxy.ts       CSP nonce + security headers only — never authorization
src/lib/security   CSP builder, static headers (rate limiting and uploads arrive with their features)
src/components     shadcn/ui (Base UI) primitives, shell, empty states
tests/unit · tests/e2e   Vitest · Playwright (+ axe, screenshots)
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase (Postgres + RLS,
Auth, Storage, Realtime) · Drizzle ORM · Resend · Vercel. Everything runs on free tiers for a pilot;
upgrade triggers are listed in PLAN.md §5.

## Security

Authorization lives in a Data Access Layer and in Postgres Row-Level Security; `proxy.ts` never makes
authorization decisions. Every response carries a nonce-based Content-Security-Policy and the usual
hardening headers. Report vulnerabilities privately via [SECURITY.md](SECURITY.md).

Licence: [MIT](LICENSE).
