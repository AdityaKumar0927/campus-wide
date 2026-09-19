# Campus Wide

A multi-tenant community platform any university can adopt. Students verified by their
university email get a calmer, kinder, identity-accountable space: questions and answers,
events, a no-payment marketplace with masked contact, a gifting-only meal board, lost and
found, rides, study groups, roommates, and polls, with human-first moderation and real
privacy and compliance functionality. Each university is an isolated tenant enforced by
Postgres Row-Level Security.

**Status:** Phases 0 to 8 built for the Illinois Tech pilot: sign-in and tenancy, the board and its
modules, the masked relay, moderation with statements of reasons and appeals, the admin portal,
progressive AI, the policy set with versioned consent, data export and deletion, and the installable
PWA. What remains is the launch checklist in [ROADMAP.md](ROADMAP.md) and the owner steps in
[PLAN.md](PLAN.md). Live: https://campus-wide.vercel.app · Pilot design: [docs/pilot/illinois-tech.md](docs/pilot/illinois-tech.md)

## Quick start

Prerequisites: **Node 24 LTS** (the repo pins it in `.nvmrc`; use [fnm](https://github.com/Schniz/fnm)
or nvm) and **pnpm 12** via corepack. Node 25 is end-of-life and is not supported.

```bash
corepack enable && corepack prepare pnpm@12.4.2 --activate
pnpm install                 # supply-chain policies live in pnpm-workspace.yaml
cp .env.example .env.local
pnpm db:start                # local Supabase in Docker; paste the printed URL/keys into .env.local
pnpm dev                     # http://localhost:3000 — sign-in codes land in Mailpit at http://127.0.0.1:54324
```

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (eslint-config-next) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:rls` | Integration tests against the local Supabase stack: auth hooks, triggers, tenant isolation |
| `pnpm db:generate` / `pnpm db:reset` | Generate a Drizzle migration from `src/lib/db/schema`; reapply all migrations and the seed |
| `pnpm build` then `pnpm test:e2e` | Playwright at 390 px and 1440 px with axe accessibility checks; visual baselines are Linux-only and produced by CI |
| `pnpm build` then `pnpm lighthouse:server` | Lighthouse budget at mobile and desktop (starts and stops the server for you) |
| `pnpm policies:sync` | Hashes `content/policies/*.mdx` into `policy_versions`, so a changed document asks members to accept the new version |
| `pnpm build:sw` | Compiles the service worker (`src/sw.ts` to `public/sw.js`); `pnpm build` runs it first |
| `pnpm push:keys` | Prints a fresh VAPID key pair for Web Push |

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

## Documents

| For | Read |
|---|---|
| A campus admin running the board | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) |
| A university deciding whether to adopt it | [UNIVERSITY_ONBOARDING.md](UNIVERSITY_ONBOARDING.md) |
| A security or privacy office | [docs/compliance/](docs/compliance/) (HECVAT, data map, security verification, incident response) |
| A member | The 16 published policies at `/policies`, written in `content/policies/` |
| A contributor | [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [PLAN.md](PLAN.md), [TASKS.md](TASKS.md) |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase (Postgres + RLS,
Auth, Storage, Realtime) · Drizzle ORM · Resend · Vercel. Everything runs on free tiers for a pilot;
upgrade triggers are listed in PLAN.md §5.

## Security

Authorization lives in a Data Access Layer and in Postgres Row-Level Security; `proxy.ts` never makes
authorization decisions. Every response carries a nonce-based Content-Security-Policy and the usual
hardening headers. Report vulnerabilities privately via [SECURITY.md](SECURITY.md).

Licence: [MIT](LICENSE).
