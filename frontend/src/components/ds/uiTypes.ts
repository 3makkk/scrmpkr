import type React from "react";

// Generic UI props helper for DS components.
// Ensures components accept all attributes of the underlying HTML tag,
// while allowing simple extra props. Always supports composition via `children`.
export type UIProps<
  Tag extends keyof JSX.IntrinsicElements,
  Extra extends object = {},
> = Extra &
  Omit<React.ComponentPropsWithoutRef<Tag>, keyof Extra> & {
    children?: React.ReactNode;
  };
