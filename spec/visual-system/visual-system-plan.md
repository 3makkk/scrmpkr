# Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the frontend's mixed design approaches with one token-based visual system (one accent, clear action hierarchy, shared states) and document it in `docs/DESIGN_PRINCIPLES.md`.

**Architecture:** Colour roles, surfaces and radii become Tailwind v4 theme variables in `apps/frontend/src/index.css`; shared state class bundles (focus, selected, hover) live in one DS module; every component switches from raw palette classes to those tokens. A unit test scans the source for raw palette classes and old patterns; each task removes its files from the test's pending list, and the last task asserts the list is empty.

**Tech Stack:** React 19, Tailwind CSS v4 (`@theme`), Vitest (unit project, jsdom, `react-dom/server` for markup tests — no Testing Library in the repo), Storybook 10 + `@storybook/addon-vitest`, Playwright e2e, Biome.

**Spec:** `spec/visual-system/visual-system-design.md`

## Global Constraints

- Blue (`accent`) only for: primary actions, selected state, focus ring, links, result bars.
- Green (`success`) only for "done / good": voted, consensus yes. Red (`danger`) only for errors and "no consensus".
- Everything else is the `gray` family; no `slate`. Roles carry no colour.
- Buttons: primary = solid accent; secondary = transparent + thin grey outline; tertiary = grey text, white on hover; danger = secondary in red. At most one primary per view.
- No hover/press scaling and no shadows on buttons; only the floating Reveal button keeps a shadow. Poker cards lift (≈4px hover, ≈8px selected), never scale or glow.
- Focus: one ring, `focus-visible` only, identical everywhere.
- Disabled: 50% opacity + `cursor-not-allowed` — except the current role in the change-role dialog, which shows the selected look at full opacity.
- Status never by colour alone: icon + text.
- Keep every existing `data-testid`.
- DS components keep `UIProps<Tag, Extra>`, prop pass-through, `className` merging; inline Tailwind utilities only, no component CSS classes, no `@apply`. No `tailwind-merge`; resolve conflicts with the `!` suffix.
- No new dependencies. No copy changes (texts like "managing", "observing", "Active Participants (2/3)" stay).
- Before every commit: `pnpm lint && pnpm format` from the repo root, review `--unsafe` fixes, then `git -c commit.gpgsign=false commit --no-gpg-sign -m "..."` ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Conventional Commits.

## Review Focus

1. **Long names** (50 characters, no spaces) in a participant row must truncate, not push the status off the row or widen the sidebar. → test in Task 7.
2. **Keyboard focus on every interactive element** (poker cards, role cards, menu items, avatar trigger, buttons) must show the shared ring; the old `focus:ring-*` / `focus:outline-none` patterns must not survive anywhere. → guard rule in Task 1, enforced as files leave the pending list.
3. **Floating button on phones** must not cover the last row of poker cards; a voter scrolled to the bottom must still be able to click `?`. → e2e test in Task 8.
4. **A Participant who did not vote, after reveal,** shows a neutral "—" chip, not an empty row or a coloured dot. → test in Task 7.
5. **Muted text contrast** on raised surfaces must meet WCAG AA (4.5:1). The token set therefore has only `fg` and `fg-muted` (`gray-400`, ≈7:1 on `gray-900`); no dimmer text token exists. → token test in Task 1.

---

## Token reference (defined in Task 1, used by every later task)

| Utility | Value | Use |
| --- | --- | --- |
| `bg-accent` / `hover:bg-accent-hover` | `blue-600` / `blue-700` | primary buttons, result bars |
| `border-accent-strong` | `blue-500` | selected border |
| `bg-accent-soft` | `blue-500` @ 14% | selected wash |
| `outline-focus` | `blue-400` | focus ring |
| `text-success` | `green-400` | voted check, consensus yes |
| `text-danger` / `border-danger` | `red-400` | errors, no consensus, danger button |
| `bg-surface-page` | `gray-950` | page base (`bg-mesh`) |
| `bg-surface-raised` | `gray-900` @ 75% | cards, menus, modals, room card |
| `bg-surface-inset` | `gray-800` @ 50% | inputs, bar track, chips, avatars |
| `bg-surface-hover` | `white` @ 5% | hover on rows/menu items, "you" row |
| `border-line` | `gray-700` @ 50% | card borders, dividers |
| `border-line-strong` | `gray-400` @ 35% | secondary button, input, unselected card/role outline |
| `text-fg` | `gray-100` | primary text |
| `text-fg-muted` | `gray-400` | secondary text, labels |
| `rounded-chip` | `0.375rem` | badges, chips |
| `rounded-control` | `0.625rem` | buttons, inputs, rows, role options, poker cards |
| `rounded-card` | `1rem` | cards, menus, modals |

Type scale (plain utilities, no tokens): page title `text-3xl font-medium text-fg`; section title `text-xl font-medium text-fg`; label `text-xs font-medium uppercase tracking-wider text-fg-muted`. `font-bold` allowed only for poker card values and the large vote numbers in results.

---

### Task 1: Baseline commit, tokens and guard test

**Files:**
- Modify: `apps/frontend/src/index.css` (add `@theme` tokens; `bg-mesh` uses `--color-surface-page`)
- Create: `apps/frontend/src/components/ds/states.ts`
- Create: `apps/frontend/__tests__/design-tokens.test.ts`

**Interfaces:**
- Produces: the token utilities in the table above; from `ds/states.ts`:
  - `export const focusRing: string` — `"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"` (do not combine with `outline-none`: in Tailwind v4 it zeroes `--tw-outline-style`)
  - `export const selectedSurface: string` — `"border-accent-strong bg-accent-soft text-fg"`
  - `export const hoverSurface: string` — `"hover:bg-surface-hover"`
- Produces: `PENDING` array in the guard test; every later task deletes its files from it.

- [ ] **Step 1: Commit the existing branch work as the baseline**

```bash
git add .gitignore apps/e2e/tests/test-assertions.ts apps/frontend/src spec/visual-system
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(frontend): room card layout, floating reveal button and mesh background"
```

- [ ] **Step 2: Write the guard test** `design-tokens.test.ts`

Walk `apps/frontend/src` with `readdirSync(dir, { recursive: true })`, take `*.ts`/`*.tsx` except `*.stories.tsx`. Rules (each a regex with a name):
- `raw-palette`: `\b(bg|text|border|ring|from|via|to|shadow|outline|fill|stroke|placeholder|divide)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}`
- `old-radius`: `\brounded(-(sm|md|lg|xl|2xl|3xl))?\b(?!-)` (bare `rounded` included; `rounded-full`, `rounded-chip|control|card` allowed)
- `scale-hover`: `(hover|active):(-)?scale-`
- `old-focus`: `focus:(ring|outline-none)`
- `weights`: `font-(light|extrabold|black)`
- `emoji`: `[🗳🎬👁]`

```ts
const PENDING = [ /* every file that currently violates a rule, relative to src */ ];

it("migrated files use design tokens only", () => {
  for (const file of sourceFiles().filter((f) => !PENDING.includes(f)))
    expect(violations(file), file).toEqual([]);
});
it("pending files are listed only while they still violate", () => {
  for (const file of PENDING) expect(violations(file).length, file).toBeGreaterThan(0);
});
it("index.css defines the token set", () => {
  const css = readFileSync("src/index.css", "utf8");
  for (const name of ["accent", "accent-hover", "accent-strong", "accent-soft", "focus",
    "success", "danger", "surface-page", "surface-raised", "surface-inset", "surface-hover",
    "line", "line-strong", "fg", "fg-muted"]) expect(css).toContain(`--color-${name}:`);
  for (const r of ["chip", "control", "card"]) expect(css).toContain(`--radius-${r}:`);
  expect(css).not.toContain("--color-fg-subtle");
});
```

Populate `PENDING` by running the rules once and listing every violating file (expect ~25).

- [ ] **Step 3: Run it — the token test fails**

Run: `pnpm --filter @scrmpkr/frontend test design-tokens`
Expected: FAIL in "index.css defines the token set"; the other two pass.

- [ ] **Step 4: Add the tokens** to `index.css` inside `@theme`, values from the table (reference palette vars, e.g. `--color-accent: var(--color-blue-600);`, `--color-accent-soft: color-mix(in oklab, var(--color-blue-500) 14%, transparent);`). Point `bg-mesh` at `--color-surface-page`. Create `ds/states.ts`.

- [ ] **Step 5: Run tests** — `pnpm --filter @scrmpkr/frontend test` → all PASS.

- [ ] **Step 6: Commit** — `feat(frontend): add design tokens and token guard test`

---

### Task 2: Icons and the Button hierarchy

**Files:**
- Create: `apps/frontend/src/components/ds/Icon/Icon.tsx`, `Icon.stories.tsx`
- Modify: `ds/Button/Button.tsx`, `Button.stories.tsx`
- Modify: `components/auth/UsernameForm.tsx`, `RoleSelectionForm.tsx` (Cancel → `tertiary`), `pages/Room.tsx` (raw "Return Home" → `<Button>` primary), `components/room/controls/StateAwareSessionControls.tsx` (tokens; keep `rounded-full!`, shadow `shadow-xl shadow-black/40`)
- Test: `apps/frontend/__tests__/ds/Button.test.tsx`

**Interfaces:**
- Consumes: `focusRing` from `ds/states.ts`.
- Produces: `ds/Icon/Icon.tsx` named exports `CheckIcon`, `ClockIcon`, `FlagIcon`, `EyeIcon`, `BallotIcon`, `AlertIcon`, each `(props: UIProps<"svg">) => JSX.Element`, 16×16 viewBox, `stroke="currentColor"`, `aria-hidden` default `true`, default class `size-4 shrink-0`. Shapes as in `.superpowers/brainstorm/*/content/states.html`.
- Produces: `Button` with `variant?: "primary" | "secondary" | "tertiary" | "danger"` (default `"primary"`), all sizes `rounded-control px-4 py-2.5 text-sm font-medium`, `transition-colors`, `focusRing`, `disabled:opacity-50 disabled:cursor-not-allowed`.

- [ ] **Step 1: Write the failing test** (render with `renderToStaticMarkup`)

```tsx
it("primary is solid accent", () => expect(html({ variant: "primary" })).toMatch(/bg-accent\b.*hover:bg-accent-hover/));
it("secondary is an outline without fill", () => {
  const h = html({ variant: "secondary" });
  expect(h).toContain("border-line-strong"); expect(h).toContain("bg-transparent"); expect(h).not.toMatch(/bg-accent\b/);
});
it("tertiary has no border and muted text", () => {
  const h = html({ variant: "tertiary" });
  expect(h).toContain("text-fg-muted"); expect(h).toContain("hover:text-fg"); expect(h).not.toContain("border-line");
});
it("danger is a red outline", () => expect(html({ variant: "danger" })).toMatch(/border-danger.*text-danger/));
it("no variant scales or casts a shadow", () => {
  for (const v of ["primary", "secondary", "tertiary", "danger"] as const) {
    expect(html({ variant: v })).not.toMatch(/scale-|shadow/); expect(html({ variant: v })).toContain("focus-visible:outline-2");
  }
});
```

- [ ] **Step 2: Run** `pnpm --filter @scrmpkr/frontend test Button` → FAIL.
- [ ] **Step 3: Implement** Icon module and Button variants; update callers listed above; add `Tertiary` story and an `Icons` story showing all six icons.
- [ ] **Step 4: Remove migrated files from `PENDING`** (`Button.tsx`, `UsernameForm.tsx`, `RoleSelectionForm.tsx` if clean, `StateAwareSessionControls.tsx`, `pages/Room.tsx` if clean — leave a file pending if Task 6/8 still owns violations in it).
- [ ] **Step 5: Run** `pnpm --filter @scrmpkr/frontend test` and `pnpm --filter @scrmpkr/frontend exec vitest run --project=storybook` → PASS.
- [ ] **Step 6: Commit** — `feat(ds): button hierarchy and line icons`

---

### Task 3: DS surfaces — Card, Input, Dropdown, Modal, Badge, LoadingSpinner

**Files:**
- Modify: `ds/Card/Card.tsx`, `ds/Input/Input.tsx`, `ds/Dropdown/Dropdown.tsx`, `ds/Modal/Modal.tsx`, `ds/Badge/Badge.tsx` (+ its story), `core/layout/LoadingSpinner.tsx`
- Test: `apps/frontend/__tests__/ds/surfaces.test.tsx`

**Interfaces:**
- Consumes: tokens, `focusRing`.
- Produces: `Badge` without the `rounded` prop (always `rounded-chip`), `bgClass` default `"bg-surface-inset"`. `Card` = `rounded-card border border-line bg-surface-raised p-6 backdrop-blur-xl`, no `shadow-2xl`.

- [ ] **Step 1: Write the failing test**

```tsx
it("Card is a raised surface", () => expect(render(<Card />)).toMatch(/rounded-card.*border-line.*bg-surface-raised/));
it("Input is inset with the shared focus ring", () => {
  const h = render(<Input />); expect(h).toContain("bg-surface-inset"); expect(h).toContain("rounded-control"); expect(h).toContain("focus-visible:outline-2");
});
it("Badge uses the chip radius", () => expect(render(<Badge>1</Badge>)).toContain("rounded-chip"));
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Dropdown panel: `rounded-card border border-line bg-surface-raised`. Modal: keep `backdrop:bg-black/50`. Spinner: `border-line border-t-fg`.
- [ ] **Step 4: Shrink `PENDING`**, run unit + storybook tests → PASS.
- [ ] **Step 5: Commit** — `feat(ds): token surfaces for card, input, dropdown, modal, badge`

---

### Task 4: PokerCard — grey playing-card face

**Files:**
- Modify: `ds/PokerCard/PokerCard.tsx`, `PokerCard.stories.tsx`
- Test: `apps/frontend/__tests__/ds/PokerCard.test.tsx`

**Interfaces:**
- Consumes: `focusRing`, `selectedSurface`.
- Produces: unchanged props (`value`, `isSelected`, `onValueClick`, `disabled`), `aria-pressed`, `data-testid="vote-card-<value>"`.

Keep the face structure (gradient body, inner frame, two corner values, ornaments ❖ ✤, big centre value). Recolour: body `from-gray-800 to-gray-900`, `border-line-strong`, inner frame `border-line`, ornaments `text-fg-muted`, corner values `text-fg`, centre value `font-bold text-fg opacity-15`. Delete `colorFor`. Hover (not disabled, not selected): `hover:-translate-y-1 hover:border-fg-muted`. Selected: `selectedSurface` + `border-2 -translate-y-2`, inner frame `border-accent-strong/40`, centre value `opacity-100`. `rounded-control`.

- [ ] **Step 1: Write the failing test**

```tsx
it("selected card lifts with the shared selected look, no scale or glow", () => {
  const h = card({ value: 5, isSelected: true });
  expect(h).toContain("border-accent-strong"); expect(h).toContain("bg-accent-soft"); expect(h).toContain("-translate-y-2");
  expect(h).not.toMatch(/scale-|shadow-\[/);
});
it("all values share one face colour", () => {
  const classesOf = (v: number | "?") => [...card({ value: v }).matchAll(/class="([^"]*)"/g)].map((m) => m[1]);
  expect(classesOf(1)).toEqual(classesOf(8));
});
it("keeps the playing-card face", () => {
  const h = card({ value: 3 }); expect(h).toContain("❖"); expect(h.match(/>3</g)?.length).toBe(3);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4:** shrink `PENDING`, run unit + storybook → PASS.
- [ ] **Step 5: Commit** — `feat(ds): neutral poker card face with shared selected state`

---

### Task 5: UserAvatar and BarVoteChart

**Files:**
- Modify: `ds/UserAvatar/UserAvatar.tsx` (+ story), `ds/BarVoteChart/BarVoteChart.tsx` (+ story), `components/auth/AccountIndicator.tsx` (avatar trigger: replace `focus:ring-*` with `focusRing`, `rounded-full`)
- Test: `apps/frontend/__tests__/ds/avatar-chart.test.tsx`

**Interfaces:**
- Produces: `UserAvatar` props unchanged (`role` still used for the tooltip text), one style: `rounded-full bg-surface-inset text-fg font-medium`, `interactive` adds `hoverSurface`-equivalent `hover:bg-surface-hover`.
- Produces: `BarVoteChart.Row` — numeric bar `bg-accent`, `"?"` bar `bg-fg-muted/40`, value label `text-fg font-bold`, track `rounded-control bg-surface-inset border-line`; `colorClass` prop keeps overriding the bar. `BarVoteChart.Name` chip `rounded-chip bg-surface-inset border-line text-fg`.

- [ ] **Step 1: Write the failing test**

```tsx
it("avatar looks the same for every role", () => {
  const strip = (r: UserRole) => avatar({ name: "Ann Lee", role: r }).replace(/title="[^"]*"/, "");
  expect(strip(UserRole.PARTICIPANT)).toBe(strip(UserRole.FACILITATOR));
  expect(strip(UserRole.PARTICIPANT)).toBe(strip(UserRole.VISITOR));
});
it("numeric bars are accent, unknown bar is neutral", () => {
  expect(row(5)).toContain("bg-accent"); expect(row("?")).not.toContain("bg-accent"); expect(row("?")).toContain("bg-fg-muted");
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4:** shrink `PENDING`, run unit + storybook → PASS.
- [ ] **Step 5: Commit** — `feat(ds): neutral avatars and accent result bars`

---

### Task 6: Role options

**Files:**
- Modify: `components/auth/roleOptions.ts`, `RoleOptionCard.tsx`, `RoleSelectionForm.tsx` (headings to type scale)
- Test: `apps/frontend/__tests__/auth/RoleOptionCard.test.tsx`

**Interfaces:**
- Consumes: `BallotIcon`, `FlagIcon`, `EyeIcon` (Task 2); `selectedSurface`, `hoverSurface`, `focusRing`.
- Produces: `RoleOption = { role: UserRole; title: string; desc: string; Icon: (props: UIProps<"svg">) => JSX.Element }` — `active`, `hover`, `ring` and the emoji `icon` are removed. Participant → `BallotIcon`, Facilitator → `FlagIcon`, Visitor → `EyeIcon`.

Card: `rounded-control border p-4`, unselected `border-line-strong text-fg-muted` + `hoverSurface`, selected `border-2` + `selectedSurface`. Icon chip `size-10 rounded-full bg-surface-inset text-fg-muted` (selected: `text-fg`). `disabled && !selected` → `opacity-50 cursor-not-allowed`; `disabled && selected` → full opacity, `cursor-default`.

- [ ] **Step 1: Write the failing test**

```tsx
it("selected option uses the shared selected look", () => expect(cardHtml({ selected: true })).toContain("bg-accent-soft"));
it("current role (selected + disabled) stays at full opacity", () => {
  const h = cardHtml({ selected: true, disabled: true }); expect(h).not.toContain("opacity-50"); expect(h).toContain("bg-accent-soft");
});
it("renders a line icon, not emoji", () => expect(cardHtml({ selected: false })).toContain("<svg"));
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4:** shrink `PENDING`, run unit tests → PASS; run `pnpm --filter @scrmpkr/e2e exec playwright test --project=chromium facilitator-role visitor-role` → PASS.
- [ ] **Step 5: Commit** — `feat(auth): neutral role options with line icons`

---

### Task 7: Participant list

**Files:**
- Create: `components/room/status/ParticipantRow.tsx`
- Modify: `components/room/status/ContextualTeamStatus.tsx`
- Test: `apps/frontend/__tests__/room/ParticipantRow.test.tsx`

**Interfaces:**
- Consumes: `UserAvatar` (Task 5), `CheckIcon`, `ClockIcon`, `FlagIcon`, `EyeIcon`.
- Produces:

```ts
type RowStatus =
  | { kind: "voted" } | { kind: "thinking" }
  | { kind: "revealed"; value: string | null }   // null → "—"
  | { kind: "managing" } | { kind: "observing" };
type ParticipantRowProps = UIProps<"div", {
  name: string; displayName: string; role: UserRole; isYou: boolean; status: RowStatus;
  nameTestId: string;            // e.g. "participant-name-Anna"
}>;
```

Row: `flex items-center gap-3 rounded-control px-2 py-2`, `isYou` → `bg-surface-hover` (never accent). Avatar `size="sm"`. Name `min-w-0 flex-1 truncate text-sm text-fg`. Status right-aligned `text-xs text-fg-muted` with icon + text: voted → `CheckIcon` + "voted" in `text-success`; thinking → `ClockIcon` + "thinking"; managing → `FlagIcon` + "managing"; observing → `EyeIcon` + "observing"; revealed → chip `rounded-chip bg-surface-inset px-2 text-fg` with the value or "—". `ContextualTeamStatus` keeps its group headings' text, counts and all `data-testid`s (`participant-<name>`, `facilitator-<name>`, `visitor-<name>`, `*-name-<name>`, `*-count`), styles headings as the label type style, drops the bordered boxes and the `getParticipantIndicator` dots. The "🎬" role suffix is removed (the icon replaces it).

- [ ] **Step 1: Write the failing test**

```tsx
it("voted shows a green check and the word", () => { const h = row({ status: { kind: "voted" } }); expect(h).toContain("text-success"); expect(h).toContain("voted"); expect(h).toContain("<svg"); });
it("revealed without a vote shows a neutral dash chip", () => expect(row({ status: { kind: "revealed", value: null } })).toMatch(/rounded-chip[^>]*>—</));
it("you are highlighted in grey, not accent", () => { const h = row({ isYou: true }); expect(h).toContain("bg-surface-hover"); expect(h).not.toContain("accent"); });
it("long names truncate", () => expect(row({ displayName: "x".repeat(50) })).toMatch(/min-w-0[^"]*truncate|truncate[^"]*min-w-0/));
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4:** shrink `PENDING`, run unit tests → PASS; run the full chromium e2e suite → PASS (it asserts `participant-<name>` contains "voted").
- [ ] **Step 5: Commit** — `feat(room): flat participant list with status icons`

---

### Task 8: Pages and remaining components

**Files:**
- Modify: `pages/Home.tsx`, `pages/Room.tsx`, `components/auth/LoginForm.tsx`, `UserInfoSection.tsx`, `AccountIndicator.tsx` (menu items → `Button variant="tertiary"` full-width, left-aligned; `hr` → `border-line`), `components/room/header/RoomContextBar.tsx`, `components/poker/voting/VotingDeck.tsx`, `components/poker/results/VotingResults.tsx`, `components/ds/Motion/Motion.tsx`
- Create: `apps/e2e/tests/layout.spec.ts`

**Interfaces:**
- Consumes: everything above. `Motion.tsx`: delete `interactionClasses` and `motionInteractions` (unused; they encode hover scaling).

Apply the type scale (page title on Login/Join/Home, section title on results/modals/room title, label on stat labels). Home: welcome name `font-medium text-fg`; errors `text-danger` with `AlertIcon`. Results: consensus yes `text-success`, no `text-danger`. Room main card: `rounded-card border-line bg-surface-raised`. Room error state: heading `text-danger`, text `text-fg-muted`. Mobile: the room page reserves bottom space for the fixed button (`pb-24 lg:pb-0` on the page or card).

- [ ] **Step 1: Write the failing e2e test** `layout.spec.ts` (viewport 390×844): a facilitator and a participant join a room; the participant votes `5`; on the participant's page, `vote-card-?` scrolled into view is clickable (`await page.click('[data-testid="vote-card-?"]')` — Playwright fails if the floating button intercepts) and then has `aria-pressed="true"`.
- [ ] **Step 2: Run** `pnpm --filter @scrmpkr/e2e exec playwright test --project=chromium layout` → FAIL if the button covers the card (if it already passes, keep the test as a regression guard and note it).
- [ ] **Step 3: Implement** the page changes above.
- [ ] **Step 4: Empty `PENDING`** and add `it("nothing is pending", () => expect(PENDING).toEqual([]))`. Run unit, storybook and the full chromium e2e suite → PASS.
- [ ] **Step 5: Screenshot check** with the dev server: home, join, room voting (desktop and 390px), room revealed. Compare with `.superpowers/brainstorm/*/content/{buttons,states,card-face}.html`.
- [ ] **Step 6: Commit** — `feat(frontend): apply visual system to pages`

---

### Task 9: Design principles document and docs

**Files:**
- Create: `docs/DESIGN_PRINCIPLES.md`
- Modify: `apps/frontend/src/components/ds/README.md`, `CLAUDE.md` ("Other docs" list), `AGENTS.md` ("UI Component Patterns" → link), `apps/frontend/.storybook/preview.css` (background `#030712`, the `gray-950` page surface)

Write `DESIGN_PRINCIPLES.md` from the shipped code, for the maintainer and coding agents: scannable, rules and token names first, one-line reasons, examples from this app. Sections: Principles (one accent used on purpose; hierarchy before decoration; same state, same look; never colour alone; quiet surfaces, content in front) → Colour roles (token table: may / may not) → Actions (four variants, one primary per view, examples) → States → Surfaces and layout (page frame, raised card, inset; room layout; floating action) → Radii, type scale, icons, motion → Accessibility → Do / Don't (from the audit: no raw palette classes, no per-component hover effects, no emoji icons, no role colours, no `focus:` rings) → "Enforced by `__tests__/design-tokens.test.ts`". DS README: remove the rules it duplicates (hover scaling, role-coloured avatars, `interactionClasses`), link to the principles doc, keep per-component reference current (Button variants, Badge without `rounded`, Icon module, `states.ts`).

- [ ] **Step 1: Write the docs and the preview background change.**
- [ ] **Step 2: Verify** every token name and component prop mentioned in the docs exists: `grep -o '\`[a-z-]*\`' docs/DESIGN_PRINCIPLES.md` spot-checked against `index.css` and `ds/`.
- [ ] **Step 3: Final run** from repo root: `pnpm test`, `pnpm --filter @scrmpkr/frontend exec vitest run --project=storybook`, `pnpm typecheck` (only the pre-existing `main.tsx` Sentry error may remain), `pnpm test:e2e` (chromium at minimum).
- [ ] **Step 4: Commit** — `docs: add design principles and link them`
