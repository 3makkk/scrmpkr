import clsx from "clsx";
import { forwardRef } from "react";
import { controlHeight, focusRing } from "../states";
import type { UIProps } from "../uiTypes";

type InputProps = UIProps<"input">;

export default forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "rounded-control border-line-strong bg-surface-inset border px-4",
        controlHeight,
        "text-fg placeholder:text-fg-muted transition-colors duration-150",
        "hover:border-fg-muted",
        focusRing,
        className,
      )}
      {...props}
    />
  );
});
