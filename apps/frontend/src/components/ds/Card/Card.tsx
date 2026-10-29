import clsx from "clsx";
import { forwardRef } from "react";
import type { UIProps } from "../uiTypes";

type CardProps = UIProps<"div">;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-card border-line bg-surface-raised border p-6 backdrop-blur-xl",
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
