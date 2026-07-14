# Repository Guidelines

This is the main entry point for working in this repository. `README.md` covers human setup and deploy; `CLAUDE.md` points here. Deep references live in `docs/`.

## Project Structure & Module Organization

- `apps/frontend/`: React 19 + Vite + TypeScript app (`src/` with `components/`, `pages/`, `hooks/`, `AuthProvider.tsx`, `socket.ts`). Tests in `apps/frontend/__tests__/`.
- `apps/server/`: Express + Socket.io TypeScript API (`index.ts`, `roomManager.ts`, `room.ts`, `round.ts`, `roundStats.ts`, `metrics.ts`, `logger.ts`). Tests in `apps/server/__tests__/`.
- `apps/e2e/`: Playwright end-to-end tests simulating user interactions. Tests in `apps/e2e/tests/`.
- `packages/shared/` (`@scrmpkr/shared`): shared TypeScript types, the typed Socket.io event contracts, and the RBAC permission system (`permissions.ts`). Built to `dist/`; the apps import the compiled output.
- Workspace: root `package.json` (pnpm scripts), `pnpm-workspace.yaml`, shared lockfile. Env examples: `apps/frontend/.env.example`, `apps/server/.env.example`.

### Frontend Component Organization

The `apps/frontend/src/components/` directory follows a **hybrid domain + type organization** structure:

- **Domain-first grouping**: components are primarily organized by functional domain (`auth`, `room`, `poker`).
- **Type-based sub-organization**: within domains, components are grouped by responsibility (header, status, controls).
- **Clear separation**: core infrastructure (`core`), design system (`ds`), and business logic are separated. The `ds` folder has its own `README.md`.
- **Consistent imports**: exports are centralized through `components/index.ts`.
- **Feature cohesion**: related components are co-located.

## Architecture

Realtime Scrum Poker app: three apps plus one shared package, wired over Socket.io.

- **`packages/shared`** is the contract shared by client and server: domain types (`RoomState`, `RoundState`, `Participant`, `UserRole`), the typed Socket.io event interfaces (`ServerToClientEvents`, `ClientToServerEvents`), and the RBAC permission system. See `docs/ACL_DOCUMENTATION.md` for the role/resource/action model.
- **`apps/server`** sets up the typed Socket.io server in `index.ts` and manages the connection lifecycle (including enforcing a single active socket per userId). Authentication is a **placeholder**: the server reads `name`/`userId` from the socket handshake auth — it does not verify a token. Room state lives in memory (`RoomManager` → `Room` → `Round`; `roundStats.ts` computes vote statistics), so rooms disappear on restart. OpenTelemetry metrics are exported via Prometheus at `:9464/metrics`; logging is `pino`.
- **`apps/frontend`** is React 19 + Vite + Tailwind v4 + React Router. `socket.ts` is the typed Socket.io client; `AuthProvider.tsx` handles the placeholder Azure AD auth and name-based login (stored in the browser). Sentry and React Compiler are enabled.
- **`apps/e2e`** drives the full app with Playwright, using page/domain objects in `tests/domain-objects` and `tests/helpers.ts`.

## Build, Test, and Development Commands

Run from the repo root with **pnpm**:

- `pnpm install`: install dependencies for all packages.
- `pnpm dev`: run frontend and server together (frontend `:5173`, server `:4000`). `pnpm dev:frontend` / `pnpm dev:server` run one app.
- `pnpm build`: build all packages. `packages/shared` must build before the apps, since they import its compiled `dist/`.
- `pnpm test`: run Vitest across all workspaces. Single package: `pnpm --filter @scrmpkr/server test`. Single file/case: `pnpm --filter @scrmpkr/server test roomManager` or `-t "name"`.
- `pnpm test:e2e` / `pnpm test:e2e:ui`: Playwright end-to-end tests in `apps/e2e`.
- `pnpm typecheck`: `tsc --noEmit` across all packages.
- `pnpm lint`: Biome lint with autofix. `pnpm format`: Biome format.
- Frontend Storybook: `pnpm --filter @scrmpkr/frontend storybook` (dev, `:6006`); `test-storybook` runs the Vitest storybook project.

## Coding Style & Naming Conventions

- TypeScript: `strict` enabled. 2-space indentation and semicolons.
- React: components `PascalCase.tsx`; hooks `useX.ts`; utility modules `camelCase.ts`.
- Server: modules and identifiers `camelCase`; exported types/interfaces `PascalCase`.
- Imports: prefer relative paths within a package; avoid deep cross-package imports.
- Linting/formatting: **Biome** (`biome.json`) — not ESLint/Prettier. The `useSortedClasses` rule is on, so Tailwind class order is enforced; run `pnpm lint`/`pnpm format` before committing.
- Naming: avoid single-letter or cryptic identifiers (e.g., `p`, `r`) except for trivial indexes; prefer descriptive names everywhere.

## Testing Guidelines

- Framework: **Vitest** (not Jest). Test files live under each app's `__tests__/`, written in TypeScript (`*.test.ts`).
- Scope: cover room lifecycle (`roomManager`) and the permission system (`permissions`).
- Run: `pnpm test` (workspace) or `pnpm --filter @scrmpkr/frontend|@scrmpkr/server test`.

## Commit & Pull Request Guidelines

- Commits: follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `chore: ...`). Example: `feat(server): add reveal countdown and vote clear`.
- PRs: include description, linked issues, testing steps, and screenshots/GIFs for UI changes. Request review before merging.
- Keep changes scoped; update `README.md` or env examples when behavior or config changes.

## Security & Configuration

- Do not commit secrets. Copy from `*.env.example` to `.env` locally.
- Required server vars: `TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_ISSUER`, `PORT`, `CORS_ORIGIN`.
- Required frontend vars: `VITE_AZURE_TENANT_ID`, `VITE_AZURE_CLIENT_ID`, `VITE_REDIRECT_URI`, `VITE_API_URL`.
- Ensure `CORS_ORIGIN` and the frontend URL match when running locally.

## UI Component Patterns

- Props typing: all DS components must support every prop of their underlying HTML element. Use `UIProps<Tag, Extra>` from `apps/frontend/src/components/ds/uiTypes.ts`. Example: `type ButtonProps = UIProps<'button', { variant?: 'primary' | 'secondary' }>`.
- Composition only: prefer children composition over complex props. Avoid nested config objects, render props, or bespoke APIs. Keep extras to simple flags or strings when necessary.
- Pass-through: always spread unhandled props onto the underlying element to enable `id`, `title`, `onClick`, `data-*`, and `aria-*`.
- Class control: accept `className` and merge it with component defaults. Do not hide styling behind opaque props; expose via `className` and simple variant flags.
- Children first: render `children` in their natural slot and avoid hardcoded content when possible.

See `apps/frontend/src/components/ds/README.md` for the DS component reference and the Tailwind-based animation approach.

### CSS and Styling Guidelines

- **No component-specific CSS classes**: do NOT create new CSS classes in `index.css` for individual components (e.g., `.my-component`, `.special-button`).
- **No `@apply`**: do NOT use the `@apply` directive anywhere. Style with inline Tailwind utility classes directly in components.
- Shared `@keyframes`/`animate-*` utilities in `index.css` are allowed and reused across components — the prohibition is on per-component classes, not the animation vocabulary.
