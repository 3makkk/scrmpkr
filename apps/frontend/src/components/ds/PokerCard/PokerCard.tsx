import { forwardRef } from "react";
import clsx from "clsx";
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
    const colorFor = (v: Value) => {
      // Dark, muted accents for center watermark & ornaments
      const accents = [
        { faint: "text-slate-300", ornament: "text-slate-400" },
        { faint: "text-indigo-300", ornament: "text-indigo-400" },
        { faint: "text-cyan-300", ornament: "text-cyan-400" },
        { faint: "text-emerald-300", ornament: "text-emerald-400" },
        { faint: "text-amber-300", ornament: "text-amber-400" },
        { faint: "text-violet-300", ornament: "text-violet-400" },
        { faint: "text-rose-300", ornament: "text-rose-400" },
        { faint: "text-teal-300", ornament: "text-teal-400" },
      ];
      const idx = typeof v === "number" ? Math.abs(v) : 7;
      return accents[idx % accents.length];
    };

    const { faint, ornament } = colorFor(value);

    // Base styles for the poker card with CSS transitions for hover/selection
    const baseStyles = [
      "relative bg-gradient-to-br from-gray-800 to-gray-900 text-gray-200",
      "font-semibold overflow-hidden border border-gray-700/80 rounded-2xl",
      "shadow-lg cursor-pointer transition-all duration-200 ease-out",
      "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-0",
      "w-full flex items-center justify-center select-none aspect-[5/7]",
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
          !disabled && [
            "hover:border-gray-600/80 hover:shadow-xl",
            "hover:-translate-y-1 hover:scale-105",
          ],
          isSelected && [
            "-translate-y-3 scale-110 border-blue-500",
            "shadow-[0_0_20px_rgba(59,130,246,0.4),0_8px_25px_rgba(0,0,0,0.3)]",
          ],
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
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
        <div className="absolute inset-2 rounded-xl border border-gray-600/70" />

        {/* Ornaments */}
        <div
          className={clsx(
            "absolute top-2 right-2 text-xs opacity-40 md:text-sm",
            "pointer-events-none select-none",
            ornament,
          )}
        >
          ❖
        </div>
        <div
          className={clsx(
            "absolute bottom-2 left-2 text-xs opacity-40 md:text-sm",
            "pointer-events-none rotate-180 select-none",
            ornament,
          )}
        >
          ❖
        </div>
        <div
          className={clsx(
            "absolute top-1/2 left-3 -translate-y-1/2 text-xs md:text-sm",
            "pointer-events-none select-none opacity-40",
            ornament,
          )}
        >
          ✤
        </div>
        <div
          className={clsx(
            "absolute top-1/2 right-3 -translate-y-1/2 text-xs md:text-sm",
            "pointer-events-none rotate-180 select-none opacity-40",
            ornament,
          )}
        >
          ✤
        </div>

        {/* Small top-left */}
        <div className="absolute top-2 left-2 font-semibold text-slate-200 text-xs md:text-sm">
          {value}
        </div>

        {/* Small bottom-right mirrored */}
        <div className="absolute right-2 bottom-2 rotate-180 font-semibold text-slate-200 text-xs md:text-sm">
          {value}
        </div>

        {/* Big center translucent */}
        <div
          className={clsx(
            "font-extrabold text-5xl opacity-15 md:text-6xl",
            faint,
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
