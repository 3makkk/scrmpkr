import { motion } from "framer-motion";
import { forwardRef } from "react";
import type { UIProps } from "../uiTypes";
import type { MotionProps } from "framer-motion";

export type BadgeProps = UIProps<
  "span",
  {
    bgClass?: string; // Tailwind background utilities e.g. "bg-blue-600"
    rounded?: "full" | "lg" | "md" | "sm" | "none";
  }
> &
  MotionProps;

const BaseBadge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      bgClass = "bg-gray-900/70",
      className = "",
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
        className={`${bgClass} inline-flex items-center text-white ${radiusClass} px-3 py-1 ${className}`}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

BaseBadge.displayName = "BaseBadge";

const Badge = motion.create(BaseBadge);

export default Badge;
