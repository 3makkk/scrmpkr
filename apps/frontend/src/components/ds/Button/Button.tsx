import { motion } from "framer-motion";
import { forwardRef } from "react";
import type { UIProps } from "../uiTypes";
import type { MotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "danger";

type ButtonProps = UIProps<"button", { variant?: Variant }> & MotionProps;

const BaseButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      className = "",
      children,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const getVariantClasses = (variant: Variant) => {
      const baseClasses =
        "font-semibold px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";

      switch (variant) {
        case "secondary":
          return `${baseClasses} bg-gray-800/80 backdrop-blur-sm border border-gray-700/60 text-gray-200 font-medium shadow-md focus:ring-gray-400`;
        case "danger":
          return `${baseClasses} bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg focus:ring-red-400`;
        default: // primary
          return `${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg focus:ring-blue-400`;
      }
    };

    return (
      <button
        ref={ref}
        className={`${getVariantClasses(variant)} ${className}`.trim()}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

BaseButton.displayName = "BaseButton";

const Button = motion.create(BaseButton);

export default Button;
