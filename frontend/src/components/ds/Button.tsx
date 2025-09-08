import type React from "react";

type Variant = "primary" | "secondary" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseClass =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "danger"
        ? "btn-danger"
        : "btn";

  return (
    <button className={`${baseClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
