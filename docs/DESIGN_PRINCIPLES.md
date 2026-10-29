# Design Principles

How the scrmpkr UI looks and behaves. Read this before changing any styling in
`apps/frontend`. The rules are enforced by
`apps/frontend/__tests__/design-tokens.test.ts`; the tokens live in
`apps/frontend/src/index.css`, the shared state styles in
`apps/frontend/src/components/ds/states.ts`. Component APIs are documented in
`apps/frontend/src/components/ds/README.md`.

## Principles

1. **One accent, used on purpose.** Blue means "act here" or "this is chosen".
   If blue appears anywhere else, it stops meaning anything.
2. **Hierarchy before decoration.** Each view has one obvious next step. Other
   actions step down visually; no gradients, glows or shadows to compete.
3. **Same state, same look.** Selected, hover, focus and disabled look
   identical on every component, so people learn them once.
4. **Never colour alone.** Every status pairs an icon with text. Colour adds
   emphasis, it never carries the meaning by itself.
5. **Quiet surfaces, content in front.** The page frame (header and sidebar)
   sits on the background; the one thing you work on is a raised card.

## Colour roles

Use the token utilities, never raw palette classes (`bg-blue-600`,
`text-gray-400`, …). The guard test fails on raw palette classes.

| Token utility | Use for | Never for |
| --- | --- | --- |
| `bg-accent`, `hover:bg-accent-hover` | primary buttons, result bars | decoration, roles, status |
| `border-accent-strong` + `bg-accent-soft` | selected state (via `selectedSurface`) | "you", hover |
| `outline-focus` | focus ring (via `focusRing`) | anything else |
| `text-success` | voted, consensus yes | success-flavoured decoration |
| `text-danger`, `border-danger` | errors, no consensus, destructive actions | warnings, emphasis |
| `bg-surface-page` | page base (`bg-mesh`) | — |
| `bg-surface-raised` | cards, menus, modals, the room card | nested boxes inside a card |
| `bg-surface-inset` | inputs, chips, avatars, bar track | — |
| `bg-surface-hover` | hover on rows and menu items, the "you" row | selection |
| `border-line` | card borders, dividers | control outlines |
| `border-line-strong` | buttons, inputs, unselected cards and options | — |
| `text-fg` | primary text | — |
| `text-fg-muted` | secondary text, labels, placeholders | — |

There is no dimmer text token on purpose: `text-fg-muted` (gray-400) is the
lowest level that still meets WCAG AA on raised surfaces.

Roles (Participant, Facilitator, Visitor) carry no colour. They are told apart
by grouping and line icons.

## Actions

`Button` (`ds/Button/Button.tsx`) has four variants:

| Variant | Look | Use | Examples |
| --- | --- | --- | --- |
| `primary` | solid accent | the one main action of a view | Join Room, Create custom room, Reveal votes, Start Next Round |
| `secondary` | thin grey outline | alternative actions | Leave Room, Create random room |
| `tertiary` | grey text, white on hover | dismissive and menu actions | Cancel, account menu items |
| `danger` | red outline | destructive actions | (none today) |

- At most one primary per view.
- Buttons and inputs share one height (`controlHeight` in `ds/states.ts`,
  48px), so they line up in forms. Only menu items inside a dropdown are
  compact.
- No shadows, no scaling on hover or press — only colour changes.
- Every clickable element is a `Button` or uses `focusRing`; never a bare
  styled `<button>`.

## States

| State | Look | Source |
| --- | --- | --- |
| Hover | surface lightens (`hoverSurface`) or outline lightens (`hover:border-fg-muted`) | `ds/states.ts` |
| Focus | 2px accent outline, keyboard only (`focus-visible`) | `focusRing` |
| Selected | accent border + faint accent wash | `selectedSurface` |
| Disabled | 50% opacity, `cursor-not-allowed` | per component |
| Status | icon + text: green check "voted", clock "thinking", flag "managing", eye "observing"; after reveal a neutral chip with the value or "—" | `room/status/ParticipantRow.tsx` |

Exceptions, both deliberate:

- Poker cards lift instead of lightening: about 4px on hover, 8px while
  selected. They never scale or glow.
- The current role in the change-role dialog is selected and disabled at the
  same time; it keeps the selected look at full opacity.

Do not use `focus:ring-*` or `focus:outline-none`. In Tailwind v4,
`outline-none` also disables the `focus-visible` outline.

## Surfaces and layout

- Every page sits on `bg-mesh`: the page surface with a faint blue/violet/sky
  gradient mesh and a fine grain.
- Room page: header and participant sidebar sit directly on the background as
  one frame. The voting area (deck, results, observer notice) is one raised
  card (`rounded-card border-line bg-surface-raised`). Do not nest bordered
  boxes inside it.
- Session controls are one floating pill button, centred at the bottom of the
  card (bottom of the viewport on phones). It is the only button with a shadow.
- Login, join and home pages are a single `Card` centred on the background.

## Shape, type, icons, motion

- **Radii:** `rounded-chip` (badges, chips), `rounded-control` (buttons,
  inputs, rows, options, poker cards), `rounded-card` (cards, menus, modals).
  `rounded-full` only for avatars and the floating button. No other radii.
- **Type scale:**
  - page title — `text-3xl font-medium text-fg` (login, join, home)
  - section title — `text-xl font-medium text-fg` (results, modals, room title, observer notice)
  - label — `text-xs font-medium uppercase tracking-wider text-fg-muted` (sidebar groups, stat labels)
  - `font-bold` only for poker card values and the vote numbers in results.
    No `font-light`, `font-extrabold` or `font-black`.
- **Icons:** 16×16 line icons from `ds/Icon/Icon.tsx`, drawn in the current
  text colour. No emoji as icons.
- **Motion:** entrance animations (`animate-fade-in-*`, `animate-slide-in-*`)
  are fine. Interaction feedback is colour, except the poker card lift. The
  Reveal button pulses once everyone has voted.

## Accessibility

- Text contrast meets WCAG AA on every surface; use only `text-fg` and
  `text-fg-muted`.
- Every interactive element shows the shared focus ring on keyboard focus.
- Status is never colour alone (icon + text).
- Selection is exposed to assistive tech (`aria-pressed` on poker cards,
  `aria-current` on role options), not only drawn.

## Do / Don't

| Do | Don't |
| --- | --- |
| `bg-accent`, `text-fg-muted`, `border-line` | `bg-blue-600`, `text-gray-400`, `border-slate-700` |
| `selectedSurface`, `hoverSurface`, `focusRing` | one-off hover tints, rings or glows per component |
| `Button variant="tertiary"` for Cancel | a secondary or primary Cancel |
| line icon + text for status | coloured dots or emoji |
| neutral avatars and rows for every role | role colours (amber facilitators, purple visitors, …) |
| one raised card per view | cards inside cards |
| `rounded-control` | `rounded-lg`, `rounded-xl`, bare `rounded` |
