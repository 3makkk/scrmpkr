import React from "react";
import Badge from "../Badge/Badge";
import type { UIProps } from "../uiTypes";

export type VoteValue = number | "?";

type ChartProps = UIProps<
  "div",
  {
    numberOfVoters: number;
    minBarPct?: number;
    showCount?: boolean;
  }
>;

type RowProps = UIProps<
  "div",
  {
    value: VoteValue;
    colorClass?: string;
  }
>;

type NameProps = UIProps<
  "span",
  {
    bgClass?: string;
  }
>;

function isNumber(v: VoteValue): v is number {
  return typeof v === "number";
}

type ChartContextValue = {
  numberOfVoters: number;
  minBarPct: number;
  showCount: boolean;
  minVotes?: number;
  maxVotes?: number;
};

const ChartContext = React.createContext<ChartContextValue | undefined>(
  undefined,
);

const BarVoteChart: React.FC<ChartProps> & {
  Row: React.FC<RowProps>;
  Name: React.FC<NameProps>;
} = ({
  className = "",
  children,
  numberOfVoters,
  minBarPct = 6,
  showCount = true,
  ...rest
}) => {
  // Inspect children to compute global min/max vote counts
  const counts: number[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type !== Row) return;
    let c = 0;
    React.Children.forEach(child.props.children, (sub) => {
      if (React.isValidElement(sub) && sub.type === Name) c += 1;
    });
    counts.push(c);
  });
  const minVotes = counts.length ? Math.min(...counts) : undefined;
  const maxVotes = counts.length ? Math.max(...counts) : undefined;

  const ctx: ChartContextValue = {
    numberOfVoters,
    minBarPct,
    showCount,
    minVotes,
    maxVotes,
  };

  return (
    <ChartContext.Provider value={ctx}>
      <div className={`space-y-4 ${className}`} {...rest}>
        {children}
      </div>
    </ChartContext.Provider>
  );
};

const Row: React.FC<RowProps> = ({
  value,
  className = "",
  children,
  ...rest
}) => {
  const ctx = React.useContext(ChartContext);
  // Count only Name children
  const names: Array<React.ReactElement<unknown>> = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === Name) names.push(child as React.ReactElement);
  });
  const count = names.length;
  const total = Math.max(1, ctx?.numberOfVoters ?? 1);
  const effMinVotes = ctx?.minVotes ?? count;
  const effMaxVotes = ctx?.maxVotes ?? count;
  const effMinBarPct = ctx?.minBarPct ?? 6;
  const effShowCount = ctx?.showCount ?? true;
  let pct = Math.round((count / total) * 100);
  pct = Math.min(100, Math.max(effMinBarPct, pct));
  const isUnknown = value === "?";
  const valueTextClass = isUnknown ? "text-purple-300" : "text-blue-300";
  const barColor = isNumber(value)
    ? "bg-gradient-to-r from-blue-500 to-blue-600"
    : "bg-gradient-to-r from-purple-500 to-purple-600";

  // Visual scaling based on min/max across rows (only affects the value label)
  const minV = typeof effMinVotes === "number" ? effMinVotes : count;
  const maxV = typeof effMaxVotes === "number" ? effMaxVotes : count;
  const t = maxV > minV ? (count - minV) / (maxV - minV) : 1; // 0..1
  const sizeScale = 0.5 + 0.5 * t; // 0.5 → 1.0
  const maxFontRem = 3.5;
  const valueFontRem = maxFontRem * sizeScale;
  const valueOpacity = sizeScale; // 0.5 → 1.0

  return (
    <div
      className={`w-full grid grid-cols-[6rem_1fr] md:grid-cols-[7rem_1fr] gap-x-4 gap-y-3 ${className}`}
      {...rest}
    >
      <div
        className={`row-span-2 self-stretch flex items-center justify-end pr-1 text-right whitespace-nowrap leading-none font-black ${valueTextClass} drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]`}
        style={{ fontSize: `${valueFontRem}rem`, opacity: valueOpacity }}
      >
        {value}
      </div>
      <div className="relative h-10 rounded-xl bg-gray-800/40 border border-gray-700/40 overflow-hidden shadow-inner">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} rounded-xl`}
          style={{ width: `${pct}%` }}
        />
        {effShowCount && (
          <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10 flex items-center">
            <Badge
              bgClass="bg-gray-950/20"
              className="px-2 py-0.5 text-xs font-bold text-white/80"
            >
              {count}
            </Badge>
          </div>
        )}
      </div>
      <div className="col-start-2 flex items-center gap-2 flex-wrap text-white text-sm">
        {names}
      </div>
    </div>
  );
};
Row.displayName = "BarVoteChart.Row";

const Name: React.FC<NameProps> = ({
  bgClass,
  className = "",
  children,
  ...rest
}) => {
  return (
    <Badge
      bgClass={bgClass ?? "bg-gray-800/60"}
      rounded="lg"
      className={`border border-gray-700/40 whitespace-nowrap ${className}`}
      {...rest}
    >
      {children}
    </Badge>
  );
};
Name.displayName = "BarVoteChart.Name";

BarVoteChart.Row = Row;
BarVoteChart.Name = Name;

export default BarVoteChart;
