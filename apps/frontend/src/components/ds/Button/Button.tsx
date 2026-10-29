import clsx from "clsx";
import { forwardRef } from "react";
import { controlHeight, focusRing } from "../states";
import type { UIProps } from "../uiTypes";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

type ButtonProps = UIProps<"button", { variant?: Variant }>;

// One action hierarchy built on one accent colour:
// primary = solid accent, secondary = outline, tertiary = text,
// danger = outline in red. At most one primary per view.
const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-line-strong bg-transparent text-fg hover:border-fg-muted hover:bg-surface-hover",
  tertiary: "bg-transparent text-fg-muted hover:text-fg",
  danger:
    "border border-danger bg-transparent text-danger hover:bg-surface-hover",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", className, children, disabled = false, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "rounded-control px-5 text-sm font-medium transition-colors duration-150",
          controlHeight,
          "disabled:cursor-not-allowed disabled:opacity-50",
          focusRing,
          variantClasses[variant],
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
