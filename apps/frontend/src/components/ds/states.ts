// Shared state styles. Every interactive element uses these so the same state
// looks the same everywhere (see docs/DESIGN_PRINCIPLES.md).

/** Keyboard-only focus ring. Do not combine with `outline-none`. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Selected: accent border plus a faint accent wash. */
export const selectedSurface = "border-accent-strong bg-accent-soft text-fg";

/** Hover on rows, menu items and unselected options. */
export const hoverSurface = "hover:bg-surface-hover";

/** One height for buttons and inputs, so they line up side by side. */
export const controlHeight = "h-12";
