## Summary

<!-- What changes and why. Link the issue if there is one. -->

## Phase / task reference

<!-- The PLAN.md phase and the TASKS.md line this PR ticks, e.g. "Phase 1 — TASKS.md L19 (.editorconfig, CODEOWNERS, templates)". -->

## Screenshots

<!-- Required for any UI change: one at 390 px and one at 1440 px (light and dark if theming is affected). Delete this section for non-UI changes. -->

| 390 px | 1440 px |
|---|---|
|  |  |

## Checklist

- [ ] PR title is a conventional commit (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `ci:`)
- [ ] `pnpm typecheck`, `pnpm lint`, and `pnpm test` are green locally
- [ ] No secrets, tokens, or real `.env` values are included; `.env.example` updated if a variable was added
- [ ] RLS policies or the Data Access Layer (`src/lib/dal/`) touched? If yes, the cross-tenant isolation tests are updated
- [ ] Accessibility checked: keyboard navigation works and axe reports no new violations
- [ ] Docs updated (`README.md`, `ARCHITECTURE.md`, `TASKS.md`, or `docs/` as relevant)
