import type { UIProps } from "../uiTypes";
import { forwardRef } from "react";
import clsx from "clsx";

type InputProps = UIProps<"input">;

export default forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "rounded-xl border border-gray-700/60 bg-gray-800/50 px-4 py-3 backdrop-blur-sm",
        "text-white placeholder-gray-400 focus:outline-none focus:ring-2",
        "transition-all duration-200 focus:border-gray-600 focus:ring-blue-400",
        "shadow-inner focus:bg-gray-800/70",
        className,
      )}
      {...props}
    />
  );
});
