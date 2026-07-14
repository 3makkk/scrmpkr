# Design System Components

The design system (`ds`) is a set of composable, presentational React components. Two rules govern all of them (see `AGENTS.md` for the full contract):

- **Props pass-through**: every component types its props with `UIProps<Tag, Extra>` from `uiTypes.ts`, so it accepts all attributes of the underlying HTML element (`id`, `onClick`, `data-*`, `aria-*`, `className`, …) plus a few simple extras.
- **Inline Tailwind only**: all styling uses inline Tailwind utility classes. There are no component-specific CSS classes and no `@apply`.

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

Hover and press feedback is applied inline per component with Tailwind transition/transform utilities — for example `Button` uses `transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]`, and `PokerCard` combines `transition-all` with `hover:-translate-y-1 hover:scale-105` and a lifted/selected state.

### `Motion/Motion.tsx` helpers (optional)

`Motion.tsx` exports named class-name bundles so you can reuse the animation vocabulary without memorising the utility names:

- `animationClasses` — maps semantic names (`fadeIn`, `slideInFromBottom`, `scaleIn`, `float`, `glowPulse`, …) to the `animate-*` classes above.
- `interactionClasses` — reusable hover/press bundles (`cardHover`, `cardActive`, `buttonHover`, `buttonActive`, `scaleOnHover`, `liftOnHover`).
- `staggerDelay(index, baseDelay = 30)` — returns `{ className: "animation-delay-<n>" }` for staggering a list. The `animation-delay-*` utility is defined in `index.css`.
- `motionVariants` / `motionInteractions` — legacy aliases kept for backwards compatibility; they are plain class-name maps, not animation-object variants.

These helpers are available but currently not used by the DS components themselves (each component inlines its own classes). Reach for them when you want consistent animation names across several call sites; otherwise inline `animate-*` classes directly.

## Components

`ds/` contains: `Badge`, `BarVoteChart`, `Button`, `Card`, `Dropdown`, `Input`, `Modal`, `PokerCard`, `UserAvatar` (plus the `Motion` helpers above). Each lives in its own folder and is imported directly (there is no barrel `index.ts`). A few of the non-obvious ones:

### PokerCard

An estimation card rendered as a `button`.

**Extra props:** `value: number | "?"`, `isSelected?: boolean`, `onValueClick: (value) => void`. Sets `data-testid="vote-card-<value>"` for e2e tests.

### UserAvatar

Displays user initials with role-based coloring.

**Extra props:** `name`, `role` (affects color), `size: "sm" | "md" | "lg"` (default `"md"`), `showTooltip` (default `false`), `interactive` (default `false`).

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
