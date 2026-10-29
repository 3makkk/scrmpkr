import clsx from "clsx";
import { forwardRef } from "react";
import type { UIProps } from "../uiTypes";

export type BadgeProps = UIProps<
  "span",
  {
    bgClass?: string; // Tailwind background utility, e.g. "bg-accent"
  }
>;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, bgClass = "bg-surface-inset", className, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          bgClass,
          "rounded-chip text-fg inline-flex items-center px-3 py-1",
          className,
        )}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
