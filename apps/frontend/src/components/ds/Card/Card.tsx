import { forwardRef } from "react";
import clsx from "clsx";
import type { UIProps } from "../uiTypes";

type CardProps = UIProps<"div">;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-2xl border border-gray-800/80 bg-gray-900/60 p-6 shadow-2xl backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export default Card;
