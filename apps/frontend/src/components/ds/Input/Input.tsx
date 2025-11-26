import type { UIProps } from "../uiTypes";
import { forwardRef } from "react";

type InputProps = UIProps<"input">;

export default forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/60 rounded-xl px-4 py-3 
                 text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                 focus:ring-blue-400 focus:border-gray-600 transition-all duration-200
                 focus:bg-gray-800/70 shadow-inner ${className}`}
      {...props}
    />
  );
});
