# Campus Wide

A multi-tenant community platform any university can adopt. Students verified by their
university email get a calmer, kinder, identity-accountable space: questions and answers,
events, a no-payment marketplace with masked contact, a gifting-only meal board, lost and
found, rides, study groups, roommates, and polls, with human-first moderation and real
privacy and compliance functionality. Each university is an isolated tenant enforced by
Postgres Row-Level Security.

**Status:** planning complete; application code starts in Phase 1. Nothing is runnable yet.

| Read | For |
|---|---|
| [PLAN.md](PLAN.md) | decisions, phases, Definitions of Done, free-tier budget, risks |
| [ARCHITECTURE.md](ARCHITECTURE.md) | tenancy, auth, authorization (DAL + RLS), data model, security controls |
| [ROADMAP.md](ROADMAP.md) · [TASKS.md](TASKS.md) | milestones and the live checklist |
| [docs/BRIEF.md](docs/BRIEF.md) | the original build brief (source of truth) |
| [docs/research/](docs/research/) | versions and free-tier limits verified against official docs |

Stack: Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + RLS, Auth, Storage, Realtime) · Drizzle ORM · Resend · Vercel. Runtime: Node 24 LTS, pnpm 12.

Licence: [MIT](LICENSE).
