type Value = number | "?";

export default function PokerCard({
  value,
  isSelected,
  onClick,
  disabled = false,
}: {
  value: Value;
  isSelected?: boolean;
  onClick: (value: Value) => void;
  disabled?: boolean;
}) {
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
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick(value)}
      disabled={disabled}
      className={`poker-card ${isSelected ? "selected" : ""} ${
        disabled ? "disabled" : ""
      }`}
      data-testid={`vote-card-${value}`}
    >
      <div className="inner-frame" />
      {/* ornaments */}
      <div className={`ornament top-2 right-2 ${ornament}`}>❖</div>
      <div className={`ornament bottom-2 left-2 ${ornament} rotate-180`}>❖</div>
      <div className={`ornament top-1/2 left-3 -translate-y-1/2 ${ornament}`}>
        ✤
      </div>
      <div
        className={`ornament top-1/2 right-3 -translate-y-1/2 ${ornament} rotate-180`}
      >
        ✤
      </div>
      {/* small top-left */}
      <div
        className={`absolute top-2 left-2 text-xs md:text-sm font-semibold text-slate-200`}
      >
        {value}
      </div>
      {/* small bottom-right mirrored */}
      <div
        className={`absolute bottom-2 right-2 text-xs md:text-sm font-semibold text-slate-200 rotate-180`}
      >
        {value}
      </div>
      {/* big center translucent */}
      <div
        className={`text-5xl md:text-6xl font-extrabold ${faint} opacity-15`}
      >
        {value}
      </div>
    </button>
  );
}
