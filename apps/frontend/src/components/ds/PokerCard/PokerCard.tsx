import clsx from "clsx";
import { forwardRef } from "react";
import { focusRing, selectedSurface } from "../states";
import type { UIProps } from "../uiTypes";

type Value = number | "?";

type PokerCardProps = UIProps<
  "button",
  {
    value: Value;
    isSelected?: boolean;
    onValueClick: (value: Value) => void;
  }
>;

const PokerCard = forwardRef<HTMLButtonElement, PokerCardProps>(
  (
    {
      value,
      isSelected = false,
      onValueClick,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    // Base styles: one neutral face for every value; hover lifts, selection
    // uses the shared selected look and stays raised. No scaling, no glow.
    const baseStyles = [
      "relative text-fg",
      "font-semibold overflow-hidden border rounded-control",
      "cursor-pointer transition-all duration-200 ease-out",
      "w-full flex items-center justify-center select-none aspect-[5/7]",
      focusRing,
    ];

    const handleClick = () => {
      if (!disabled) {
        onValueClick(value);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={clsx(
          baseStyles,
          isSelected
            ? ["-translate-y-2 border-2", selectedSurface]
            : [
                "border-line-strong from-surface-inset bg-linear-to-br to-transparent",
                !disabled && "hover:border-fg-muted hover:-translate-y-1",
              ],
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        aria-pressed={isSelected}
        data-testid={`vote-card-${value}`}
        style={{
          transformOrigin: "center",
        }}
        {...props}
      >
        {/* Subtle ornament pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.04) 0 2px, transparent 3px),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.035) 0 2px, transparent 3px)
          `,
            backgroundSize: "48px 48px, 72px 72px",
          }}
        />

        {/* Inner frame */}
        <div
          className={clsx(
            "rounded-chip absolute inset-2 border",
            isSelected ? "border-accent-strong/40" : "border-line",
          )}
        />

        {/* Ornaments */}
        <div
          className={clsx(
            "absolute top-2 right-2 text-xs opacity-40 md:text-sm",
            "pointer-events-none select-none",
            "text-fg-muted",
          )}
        >
          ❖
        </div>
        <div
          className={clsx(
            "absolute bottom-2 left-2 text-xs opacity-40 md:text-sm",
            "pointer-events-none rotate-180 select-none",
            "text-fg-muted",
          )}
        >
          ❖
        </div>
        <div
          className={clsx(
            "absolute top-1/2 left-3 -translate-y-1/2 text-xs md:text-sm",
            "pointer-events-none opacity-40 select-none",
            "text-fg-muted",
          )}
        >
          ✤
        </div>
        <div
          className={clsx(
            "absolute top-1/2 right-3 -translate-y-1/2 text-xs md:text-sm",
            "pointer-events-none rotate-180 opacity-40 select-none",
            "text-fg-muted",
          )}
        >
          ✤
        </div>

        {/* Small top-left */}
        <div
          className={clsx(
            "absolute top-2 left-2 text-xs font-semibold md:text-sm",
            "text-fg",
          )}
        >
          {value}
        </div>

        {/* Small bottom-right mirrored */}
        <div
          className={clsx(
            "absolute right-2 bottom-2 rotate-180 text-xs font-semibold md:text-sm",
            "text-fg",
          )}
        >
          {value}
        </div>

        {/* Big center translucent */}
        <div
          className={clsx(
            "text-fg text-5xl font-bold md:text-6xl",
            isSelected ? "opacity-100" : "opacity-15",
          )}
        >
          {value}
        </div>
      </button>
    );
  },
);

PokerCard.displayName = "PokerCard";

export default PokerCard;
