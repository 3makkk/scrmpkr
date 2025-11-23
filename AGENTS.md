# Repository Guidelines

## Project Structure & Module Organization

- `apps/frontend/`: React + Vite + TypeScript app (`src/` with `components/`, `pages/`, `hooks/`). Tests in `apps/frontend/__tests__/`.
- `apps/server/`: Express + Socket.io TypeScript API (`index.ts`, `roomManager.ts`, `tokenVerify.ts`). Tests in `apps/server/__tests__/`.
- `apps/e2e/`: Playwright end-to-end tests simulating user interactions. Tests in `apps/e2e/tests/`.
- `packages/`: shared utilities and types (e.g., `packages/types/` for shared TypeScript types).
- Workspace: root `package.json` (pnpm scripts), `pnpm-workspace.yaml`, shared lockfile. Env examples: `apps/frontend/.env.example`, `apps/server/.env.example`.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies for all packages.
- `pnpm dev`: run frontend and server together.
- `pnpm dev:frontend` / `pnpm dev:server`: run individual apps (defaults: frontend `:5173`, server `:4000`).
- `pnpm build`: build all packages (server emits `dist/`).
- `pnpm test`: run Jest tests across workspaces. For a single package: `pnpm --filter server test`.
- `pnpm test:e2e`: run end-to-end tests in `e2e/` using Playwright.

## Coding Style & Naming Conventions

- TypeScript: `strict` enabled. Use 2-space indentation and semicolons.
- React: components `PascalCase.tsx`; hooks `useX.ts`; utility modules `camelCase.ts`.
- Server: modules and identifiers `camelCase`; exported types/interfaces `PascalCase`.
- Imports: prefer relative paths within a package; avoid deep cross-package imports.
- Linters/formatters: ESLint/Prettier not configured—keep style consistent with existing files.
- Naming: avoid single-letter or cryptic identifiers (e.g., `p`, `r`) except for trivial indexes; prefer descriptive variable names everywhere.

## Testing Guidelines

- Framework: Vitest. Test files live under `__tests__/` and use `*.test.js`.
- Scope: cover room lifecycle (`roomManager`) and auth (`tokenVerify`).
- TypeScript tests: either test compiled output after `pnpm --filter server build` or add `ts-jest` before writing `.ts` tests.
- Run: `pnpm test` (workspace) or `pnpm --filter frontend|server test`.

## Commit & Pull Request Guidelines

- Commits: follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `chore: ...`).
  Example: `feat(server): add reveal countdown and vote clear`.
- PRs: include description, linked issues, testing steps, and screenshots/GIFs for UI changes. Request review before merging.
- Keep changes scoped; update README or env examples when behavior or config changes.

## Security & Configuration Tips

- Do not commit secrets. Copy from `*.env.example` to `.env` locally.
- Required server vars: `TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_ISSUER`, `PORT`, `CORS_ORIGIN`.
- Required frontend vars: `VITE_AZURE_TENANT_ID`, `VITE_AZURE_CLIENT_ID`, `VITE_REDIRECT_URI`, `VITE_API_URL`.
- Ensure `CORS_ORIGIN` and frontend URLs match when running locally.

## UI Component Patterns

- Props typing: All DS components must support every prop of their underlying HTML element. Use `UIProps<Tag, Extra>` from `frontend/src/components/ds/uiTypes.ts` to compose your props. Example: `type ButtonProps = UIProps<'button', { variant?: 'primary' | 'secondary' }>`.
- Composition only: Prefer children composition over complex props. Avoid nested config objects, render props, or bespoke APIs. Keep extras to simple flags or strings when necessary.
- Pass-through: Always spread unhandled props onto the underlying element to enable attributes like `id`, `title`, `onClick`, `data-*`, and `aria-*`.
- Class control: Accept `className` and merge it with component defaults. Do not hide styling behind opaque props; expose via `className` and simple variant flags.
- Children first: Components should render `children` in their natural slot and avoid hardcoded content when possible.

Shared types

- File: `frontend/src/components/ds/uiTypes.ts`
- Export: `UIProps<Tag, Extra>` ensures consistent typing across DS components.
