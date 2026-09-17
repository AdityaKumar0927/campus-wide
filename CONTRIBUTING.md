# Contributing to Campus Wide

Thanks for helping build a calmer, safer community platform for students. This guide covers local setup, the workflow, and the rules that keep the project safe to run for real universities.

## Prerequisites

- **Node 24 LTS.** The version is pinned in `.nvmrc` / `.node-version` and enforced by `engines` in `package.json`. Use a version manager:
  - fnm: `fnm install && fnm use`
  - nvm: `nvm install && nvm use`

  Node 25 is end-of-life and not offered by Vercel; it is unsupported here.
- **pnpm 12, managed by corepack.** The exact version is the `packageManager` field in `package.json`:

  ```sh
  corepack enable && corepack prepare pnpm@12.4.2 --activate
  ```

  Do not install pnpm globally with npm; corepack keeps everyone on the same version.
- **Docker** (from Phase 2) for the local Supabase stack used by the RLS isolation tests.

## Setup

```sh
git clone https://github.com/AdityaKumar0927/campus-wide.git
cd campus-wide
pnpm install
cp .env.example .env.local
```

`.env.local` is git-ignored. Fill in only the variables you need for the work at hand; every variable is documented in `.env.example` and `ARCHITECTURE.md` §16.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests (plus the RLS isolation suite when local Supabase is running) |
| `pnpm test:e2e` | Playwright end-to-end and accessibility tests at 390 px and 1440 px |
| `pnpm build` | Production build |

CI runs the same commands in this order: install, typecheck, lint, test, build, then Playwright.

## Branches and pull requests

1. Branch from `main`: `feat/short-description`, `fix/...`, `docs/...`, and so on. Never commit directly to `main`.
2. Keep pull requests small and focused on one change; reference the `TASKS.md` line or the issue.
3. Open the PR against `main` and fill in the template. UI changes need screenshots at 390 px and 1440 px.
4. CI must be green (typecheck, lint, tests, build, Playwright, CodeQL, secret scan) before review.
5. Merges are **squash or rebase** only; the `main` ruleset does not allow merge commits, force pushes, or branch deletion.
6. Dependabot opens grouped weekly update PRs; review and merge them like any other PR.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/), and **commitlint enforces them** through a Husky `commit-msg` hook, so a non-conforming message is rejected locally. The PR title must follow the same format because it becomes the squash commit.

Types used here: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `ci:`.

```
feat: add accepted-answer toggle to Q&A threads
fix(dal): scope event queries by university_id
docs: expand CONTRIBUTING with Docker prerequisites
```

Optional scopes in parentheses are welcome (`feat(events): ...`). Use the body to explain *why*, and a `BREAKING CHANGE:` footer when behaviour changes for existing campuses.

## Code rules

These come from `AGENTS.md` and do not bend:

- **Authorization lives in the Data Access Layer *and* Postgres Row-Level Security.** Every query goes through `src/lib/dal/`, takes the caller's session, and scopes by `university_id`; every domain table has an RLS policy. `proxy.ts` (middleware) is never the security boundary. If you touch the DAL or a policy, update the cross-tenant isolation tests.
- **No secrets in git.** Real values live in `.env.local` and Vercel environment variables. Keep `.env.example` current when you add a variable. gitleaks runs in CI.
- **No PII in server-side AI calls.** Anything sent to an external model is opt-in, PII-stripped, and labelled in the UI. On-device inference is the default.
- **Student emails are never exposed publicly.** Contact between users goes through the masked relay; never render, log, or export an email address to another user.
- **No payments, no resale.** The marketplace has no payment flow; the meal board is gifting and donation only, with no price fields.
- **No auto-ban.** AI moderation only labels and suggests; a human decides.
- Validate every input at the boundary with Zod, keep dependency versions pinned, and check official docs before using a library API (see `docs/research/`).

## UI rules

- Verify every UI change at **390 px** and **1440 px** (Playwright projects exist for both) before calling it done, and attach screenshots to the PR.
- Everything must be operable by keyboard with a visible focus ring. Run axe (wired into the Playwright suite) and fix violations rather than suppressing them. The target is WCAG 2.2 AA.
- Respect `prefers-reduced-motion`: animation is gated behind it and must never be required to understand state.
- Support light, dark, and system themes; use the semantic OKLCH tokens rather than raw colours.
- Prefer paged loading over infinite scroll; provide empty states and skeletons.

## Where things are documented

| File | Contents |
|---|---|
| `docs/BRIEF.md` | Product brief: the source of truth for scope |
| `PLAN.md` | Decisions, phases, Definitions of Done, free-tier budget, risks |
| `ARCHITECTURE.md` | Tenancy, auth, DAL + RLS, data model, security controls, environment variables |
| `ROADMAP.md` / `TASKS.md` | Milestones and the live checklist |
| `docs/research/` | Versions and limits verified against official docs |
| `docs/audits/` | Phase audits |
| `SECURITY.md` | Vulnerability reporting policy |
| `AGENTS.md` | Working agreement for AI coding agents |

Update the relevant document in the same PR as the code change.

## Code of Conduct

Participation in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By contributing, you agree to abide by it.
