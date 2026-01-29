import { forwardRef } from "react";
import clsx from "clsx";
import type { UIProps } from "../uiTypes";

export type BadgeProps = UIProps<
  "span",
  {
    bgClass?: string; // Tailwind background utilities e.g. "bg-blue-600"
    rounded?: "full" | "lg" | "md" | "sm" | "none";
  }
>;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      bgClass = "bg-gray-900/70",
      className,
      rounded = "lg",
      ...rest
    },
    ref,
  ) => {
    const radiusMap: Record<NonNullable<BadgeProps["rounded"]>, string> = {
      full: "rounded-full",
      lg: "rounded-lg",
      md: "rounded-md",
      sm: "rounded-sm",
      none: "rounded-none",
    };
    const radiusClass = radiusMap[rounded];

    return (
      <span
        ref={ref}
        className={clsx(
          bgClass,
          "inline-flex items-center text-white",
          radiusClass,
          "px-3 py-1",
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
