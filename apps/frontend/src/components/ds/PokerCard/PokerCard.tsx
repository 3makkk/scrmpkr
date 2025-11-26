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

export default function PokerCard({
  value,
  isSelected = false,
  onValueClick,
  disabled = false,
  className = "",
  ...props
}: PokerCardProps) {
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

  // Base styles for the poker card
  const baseStyles = `
    relative bg-gradient-to-br from-gray-800 to-gray-900 text-gray-200 font-semibold overflow-hidden
    border border-gray-700/80 rounded-2xl shadow-lg cursor-pointer
    transition-all duration-200 ease-out hover:shadow-xl hover:border-gray-600/80
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-0
    w-full flex items-center justify-center select-none
    will-change-transform z-0 hover:scale-105
    aspect-[5/7]
  `;

  // State-dependent styles
  const hoverStyles = !disabled
    ? "hover:translate-y-[-8px] hover:rotate-[-2deg] hover:scale-105"
    : "";
  const selectedStyles = isSelected
    ? "shadow-2xl scale-110 border-blue-500/80 translate-y-[-14px] rotate-[-4deg] scale-110 z-20"
    : "";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const handleClick = () => {
    if (!disabled) {
      onValueClick(value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${hoverStyles} ${selectedStyles} ${disabledStyles} ${className}`}
      data-testid={`vote-card-${value}`}
      style={{
        transformOrigin: "center",
      }}
      {...props}
    >
      {/* Subtle ornament pattern overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
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
        className={`absolute top-2 right-2 text-xs md:text-sm opacity-40 select-none pointer-events-none ${ornament}`}
      >
        ❖
      </div>
      <div
        className={`absolute bottom-2 left-2 text-xs md:text-sm opacity-40 select-none pointer-events-none ${ornament} rotate-180`}
      >
        ❖
      </div>
      <div
        className={`absolute top-1/2 left-3 -translate-y-1/2 text-xs md:text-sm opacity-40 select-none pointer-events-none ${ornament}`}
      >
        ✤
      </div>
      <div
        className={`absolute top-1/2 right-3 -translate-y-1/2 text-xs md:text-sm opacity-40 select-none pointer-events-none ${ornament} rotate-180`}
      >
        ✤
      </div>

      {/* Small top-left */}
      <div className="absolute top-2 left-2 text-xs md:text-sm font-semibold text-slate-200">
        {value}
      </div>

      {/* Small bottom-right mirrored */}
      <div className="absolute bottom-2 right-2 text-xs md:text-sm font-semibold text-slate-200 rotate-180">
        {value}
      </div>

      {/* Big center translucent */}
      <div
        className={`text-5xl md:text-6xl font-extrabold ${faint} opacity-15`}
      >
        {value}
      </div>
    </button>
  );
}
