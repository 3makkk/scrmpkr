# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `AGENTS.md` first.** It is the canonical entry point and covers project structure, architecture, commands (build/test/lint/typecheck, including how to run a single test), coding style, testing, and UI/CSS conventions.

Other docs:

- `README.md` — human setup, env vars, Prometheus metrics, and the deploy runbook.
- `docs/ACL_DOCUMENTATION.md` — the RBAC role/resource/action model in `packages/shared`.
- `apps/frontend/src/components/ds/README.md` — design-system component reference and the Tailwind-based animation approach.
- `apps/e2e/README.md` — end-to-end test scenarios and flow.

Do not duplicate the content of those files here — link to them and keep each fact in one place.

## Before every commit

Run lint and format, and stage the results, before creating any commit:

```bash
pnpm lint    # biome lint --write --unsafe .
pnpm format  # biome format . --write
```

Review what `--unsafe` autofixes changed before staging — it can rewrite code, not just style.

Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
