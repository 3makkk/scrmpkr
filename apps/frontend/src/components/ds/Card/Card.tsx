import { forwardRef } from "react";
import type { UIProps } from "../uiTypes";

type CardProps = UIProps<"div">;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", ...props }, ref) => {
    const cardClasses =
      "bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 shadow-2xl";

    return (
      <div ref={ref} className={`${cardClasses} ${className}`} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export default Card;
