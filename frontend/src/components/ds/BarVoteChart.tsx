import type React from "react";

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
  nameBadgeClassName = "bg-gray-800/60 border border-gray-700/40",
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
        className="w-full grid grid-cols-[4rem_1fr] gap-x-4 gap-y-3 items-center"
      >
        <div className="text-right text-white text-base font-semibold">
          {valueLabel ? valueLabel(label) : label}
        </div>
        <div className="relative h-10 rounded-xl bg-gray-800/40 border border-gray-700/40 overflow-hidden shadow-inner">
          <div
            className={`absolute inset-y-0 left-0 ${color} rounded-xl`}
            style={{ width: `${pct}%` }}
          />
          {showCount && (
            <div className="absolute inset-y-0 right-3 z-10 flex items-center text-white/90 text-sm font-semibold">
              {names.length}
            </div>
          )}
        </div>
        <div className="col-start-2 flex items-center gap-2 flex-wrap text-white text-sm">
          {names.map((n) => (
            <span
              key={n}
              className={`${nameBadgeClassName} rounded-lg px-3 py-1 whitespace-nowrap`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedNumeric.map(([val, names]) =>
        renderRow(val, names, "bg-gradient-to-r from-blue-500 to-blue-600"),
      )}
      {unknown.length > 0 &&
        renderRow(
          "?",
          unknown,
          "bg-gradient-to-r from-purple-500 to-purple-600",
        )}
    </div>
  );
}
