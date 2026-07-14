# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` holds the detailed contributor conventions (component organization, UI/CSS patterns, naming, commit style). Read it for those topics; this file covers commands and the big-picture architecture.

## Commands

Package manager is **pnpm** (workspace monorepo). Run from the repo root:

- `pnpm dev` — run frontend and server together (frontend `:5173`, server `:4000`).
- `pnpm dev:frontend` / `pnpm dev:server` — run one app.
- `pnpm build` — build all packages (`pnpm -r build`). `packages/shared` must build before server/frontend since they import its compiled `dist/`.
- `pnpm test` — Vitest across all workspaces (`pnpm -r test`).
- `pnpm --filter @scrmpkr/server test` — test a single package. Add a file path or `-t "name"` for one test/case (`pnpm --filter @scrmpkr/server test roomManager`).
- `pnpm test:e2e` / `pnpm test:e2e:ui` — Playwright end-to-end tests in `apps/e2e`.
- `pnpm typecheck` — `tsc --noEmit` across all packages.
- `pnpm lint` — Biome lint with autofix. `pnpm format` — Biome format.

Frontend also has Storybook: `pnpm --filter @scrmpkr/frontend storybook` (dev, `:6006`) and `test-storybook` (Vitest storybook project).

**Tooling note:** Linting/formatting is **Biome**, not ESLint/Prettier (`biome.json`). The `useSortedClasses` nursery rule is on, so Tailwind class order is enforced. Tests are **Vitest**, not Jest (the README/AGENTS mentions of Jest are stale).

## Architecture

Realtime Scrum Poker app. Three apps plus one shared package, wired over Socket.io.

- **`packages/shared`** (`@scrmpkr/shared`) — the contract shared by client and server. Holds the domain types (`RoomState`, `RoundState`, `Participant`, `UserRole`), the typed Socket.io event interfaces (`ServerToClientEvents`, `ClientToServerEvents`), and the **RBAC permission system** (`permissions.ts`). Both other apps import from its built `dist/`, so rebuild shared after changing it. See `docs/ACL_DOCUMENTATION.md` for the role/resource/action model.

- **`apps/server`** (`@scrmpkr/server`) — Express + Socket.io API (TypeScript, ESM, run with `tsx` in dev). `index.ts` sets up the typed Socket.io server and handles connection lifecycle (including enforcing a single active socket per userId). Room state lives in memory: `RoomManager` → `Room` → `Round` (`roundStats.ts` computes vote statistics). Auth token verification and role assignment feed the shared permission checks. OpenTelemetry metrics are exported via Prometheus at `:9464/metrics` (`metrics.ts`); logging is `pino` (`logger.ts`).

- **`apps/frontend`** (`@scrmpkr/frontend`) — React 19 + Vite + TypeScript, Tailwind v4, React Router. `socket.ts` is the typed Socket.io client; `AuthProvider.tsx` handles the placeholder Azure AD auth and name-based login (stored in the browser). Components under `src/components/` are organized domain-first (`auth`, `room`, `poker`) with `core`, `ds` (design system) separated — see AGENTS.md for the rules. DS component reference: `apps/frontend/src/components/ds/README.md`. Sentry and React Compiler are enabled.

- **`apps/e2e`** (`@scrmpkr/e2e`) — Playwright specs driving the full app; uses page/domain objects in `tests/domain-objects` and `tests/helpers.ts`. Test scenarios and flow: `apps/e2e/README.md`.

Server state is in-memory only — there is no database; rooms disappear on restart.

## Environment

Copy `apps/server/.env.example` and `apps/frontend/.env.example` to `.env`. Server needs `TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_ISSUER`, `PORT`, `CORS_ORIGIN`. Frontend needs `VITE_AZURE_TENANT_ID`, `VITE_AZURE_CLIENT_ID`, `VITE_REDIRECT_URI`, `VITE_API_URL`. Keep `CORS_ORIGIN` and the frontend URL consistent locally.

## Deploy

Docker images built per app (`apps/*/Dockerfile`), pushed to `ghcr.io/3makkk/scrmpkr-*`, deployed via `docker-stack.yml` to the `friedemann.dev` Docker context behind Traefik. See README for the exact build/push/deploy commands.
