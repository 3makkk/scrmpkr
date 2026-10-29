# Design System Components

The design system (`ds`) is a set of composable, presentational React components. Two rules govern all of them (see `AGENTS.md` for the full contract):

- **Props pass-through**: every component types its props with `UIProps<Tag, Extra>` from `uiTypes.ts`, so it accepts all attributes of the underlying HTML element (`id`, `onClick`, `data-*`, `aria-*`, `className`, …) plus a few simple extras.
- **Inline Tailwind only**: all styling uses inline Tailwind utility classes. There are no component-specific CSS classes and no `@apply`.

Colours, surfaces, radii, states and type follow `docs/DESIGN_PRINCIPLES.md` — use the token utilities from `index.css` and the shared state styles from `states.ts`, never raw palette classes. This file covers only the component reference.

## Animations

Animation is **pure Tailwind CSS**, not a JavaScript animation library. There is no Framer Motion dependency and no motion-prop API (`animate`, `whileHover`, `enableMotion`, etc. do not exist).

Animations are defined once in `apps/frontend/src/index.css` as Tailwind v4 theme variables (`--animate-*`) backed by `@keyframes`, and consumed as ordinary `animate-*` utility classes:

| Utility class | Effect |
| --- | --- |
| `animate-fade-in-scale` | Fade in with a slight scale |
| `animate-fade-in-down` | Fade in while sliding down |
| `animate-bounce-in` | Scale in with a bounce |
| `animate-slide-in-left` / `animate-slide-in-right` | Slide in horizontally |
| `animate-rotate-in` | Rotate in |
| `animate-float` | Continuous floating loop |
| `animate-glow-pulse` | Continuous glow pulse |
| `animate-shimmer` | Continuous shimmer loop |

Hover, focus and selected feedback comes from the shared bundles in `states.ts` (`hoverSurface`, `focusRing`, `selectedSurface`); see `docs/DESIGN_PRINCIPLES.md` for the rules.

### `Motion/Motion.tsx` helpers (optional)

`Motion.tsx` exports named class-name bundles so you can reuse the animation vocabulary without memorising the utility names:

- `animationClasses` — maps semantic names (`fadeIn`, `slideInFromBottom`, `scaleIn`, `float`, `glowPulse`, …) to the `animate-*` classes above.
- `staggerDelay(index, baseDelay = 30)` — returns `{ className: "animation-delay-<n>" }` for staggering a list. The `animation-delay-*` utility is defined in `index.css`.
- `motionVariants` — legacy alias kept for backwards compatibility; a plain class-name map.

## Components

`ds/` contains: `Badge`, `BarVoteChart`, `Button`, `Card`, `Dropdown`, `Icon`, `Input`, `Modal`, `PokerCard`, `UserAvatar` (plus the `Motion` helpers above and the shared state styles in `states.ts`). Each lives in its own folder and is imported directly (there is no barrel `index.ts`). A few of the non-obvious ones:

### Button

**Extra props:** `variant: "primary" | "secondary" | "tertiary" | "danger"` (default `"primary"`). See the action hierarchy in `docs/DESIGN_PRINCIPLES.md` for when to use each.

### Icon

Named 16×16 line icons: `CheckIcon`, `ClockIcon`, `FlagIcon`, `EyeIcon`, `BallotIcon`, `AlertIcon`. They take all `<svg>` props, draw in `currentColor`, and are `aria-hidden` by default.

```tsx
<CheckIcon className="size-5" />
```

### Badge

A small chip (`rounded-chip`). **Extra props:** `bgClass` (default `"bg-surface-inset"`).

### PokerCard

An estimation card rendered as a `button`.

**Extra props:** `value: number | "?"`, `isSelected?: boolean`, `onValueClick: (value) => void`. Sets `data-testid="vote-card-<value>"` for e2e tests.

### UserAvatar

Displays user initials. Every role looks the same; `role` only feeds the tooltip text.

**Extra props:** `name`, `role` (tooltip text), `size: "sm" | "md" | "lg"` (default `"md"`), `showTooltip` (default `false`), `interactive` (default `false`).

```tsx
<UserAvatar name="John Doe" role={UserRole.PARTICIPANT} size="md" interactive showTooltip />
```

### Dropdown

Dropdown menu with controlled or uncontrolled open state. Closes on outside click and on Escape.

**Extra props:** `trigger` (node that opens the menu), `open?`, `onOpenChange?`, `placement: "bottom-left" | "bottom-right" | "top-left" | "top-right"` (default `"bottom-right"`).

```tsx
<Dropdown trigger={<button>Open Menu</button>} placement="bottom-right">
  <div className="p-4">Menu content here</div>
</Dropdown>
```

### Modal

Overlay for content above the main interface. Manages focus; closes on backdrop click and Escape (both configurable).

**Extra props:** `open`, `onClose`, `closeOnEscape` (default `true`), `closeOnBackdrop` (default `true`).

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <Card>Modal content here</Card>
</Modal>
```

## Component Architecture Principles

- **Composition over configuration**: favor `children` composition over complex props, nested config objects, or render props.
- **Type safety and pass-through**: every component uses `UIProps<Tag, Extra>` and spreads unhandled props onto the underlying element.
- **Accessibility**: keyboard navigation and ARIA support where appropriate.
- **Consistent styling**: inline Tailwind classes only — no custom CSS classes, no `@apply`.
