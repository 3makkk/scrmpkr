import React from "react";

export type VoteValue = number | "?";

export type BarVoteItem = {
  value: VoteValue;
  names: string[];
};

export type BarVoteChartProps = {
  items: BarVoteItem[];
  sortBy?: "value" | "count"; // value: numeric high→low, '?' last. count: most names first
  order?: "desc" | "asc";
  minBarPct?: number; // minimum visible width
  className?: string;
  valueLabel?: (value: VoteValue) => React.ReactNode;
  nameBadgeClassName?: string;
  showCount?: boolean; // show absolute count inside the bar
};

function isNumber(v: VoteValue): v is number {
  return typeof v === "number";
}

// Groups input items by value and flattens names per value
function groupByValue(items: BarVoteItem[]): Map<VoteValue, string[]> {
  const map = new Map<VoteValue, string[]>();
  for (const it of items) {
    const key = it.value;
    const curr = map.get(key) ?? [];
    map.set(key, curr.concat(it.names));
  }
  return map;
}

export default function BarVoteChart({
  items,
  sortBy = "value",
  order = "desc",
  minBarPct = 6,
  className = "",
  valueLabel,
  nameBadgeClassName = "bg-slate-900/30",
  showCount = true,
}: BarVoteChartProps) {
  const grouped = groupByValue(items);

  const numericEntries = Array.from(grouped.entries()).filter(([v]) =>
    isNumber(v),
  ) as Array<[number, string[]]>;
  const unknown = grouped.get("?") ?? [];

  // Sorting
  const sortedNumeric = numericEntries.sort((a, b) => {
    if (sortBy === "count") {
      const diff = b[1].length - a[1].length;
      return order === "asc" ? -diff : diff;
    }
    const diff = (b[0] as number) - (a[0] as number);
    return order === "asc" ? -diff : diff;
  });

  const maxCount = Math.max(
    1,
    ...sortedNumeric.map(([, names]) => names.length),
    unknown.length,
  );
  // Always scale by count (design decision)

  const renderRow = (label: VoteValue, names: string[], color: string) => {
    let pct = Math.round((names.length / maxCount) * 100);
    // Ensure visible but never exceed 100%
    pct = Math.min(100, Math.max(minBarPct, pct));
    return (
      <div
        key={String(label)}
        className="w-full grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-2 items-center"
      >
        <div className="text-right text-white text-sm font-medium">
          {valueLabel ? valueLabel(label) : label}
        </div>
        <div className="relative h-9 rounded bg-slate-500/20 overflow-hidden">
          <div className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${pct}%` }} />
          {showCount && (
            <div className="absolute inset-y-0 right-2 z-10 flex items-center text-white/90 text-xs font-medium">
              {names.length}
            </div>
          )}
        </div>
        <div className="col-start-2 flex items-center gap-2 flex-wrap text-white text-sm">
          {names.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className={`${nameBadgeClassName} rounded px-2 py-0.5 whitespace-nowrap`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedNumeric.map(([val, names]) => renderRow(val, names, "bg-sky-600/80"))}
      {unknown.length > 0 && renderRow("?", unknown, "bg-purple-600/70")}
    </div>
  );
}
