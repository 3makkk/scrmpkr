import clsx from "clsx";
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
  className,
  children,
  numberOfVoters,
  minBarPct = 6,
  showCount = true,
  ...rest
}) => {
  // Inspect children to compute global min/max vote counts
  const counts: number[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return;
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
      <div className={clsx("space-y-4", className)} {...rest}>
        {children}
      </div>
    </ChartContext.Provider>
  );
};

const Row: React.FC<RowProps> = ({
  value,
  colorClass,
  className,
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
  // Numeric votes use the accent; "?" stays neutral and is told apart by its label.
  const barColor =
    colorClass ?? (isNumber(value) ? "bg-accent" : "bg-fg-muted/40");

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
      className={clsx(
        "grid w-full grid-cols-[6rem_1fr] gap-x-4 gap-y-3 md:grid-cols-[7rem_1fr]",
        className,
      )}
      {...rest}
    >
      <div
        className={clsx(
          "row-span-2 flex items-center justify-end self-stretch pr-1",
          "text-fg text-right leading-none font-bold whitespace-nowrap",
        )}
        style={{ fontSize: `${valueFontRem}rem`, opacity: valueOpacity }}
      >
        {value}
      </div>
      <div className="rounded-control border-line bg-surface-inset relative h-10 overflow-hidden border">
        <div
          className={clsx(
            "rounded-control absolute inset-y-0 left-0",
            barColor,
          )}
          style={{ width: `${pct}%` }}
        />
        {effShowCount && (
          <div className="absolute top-1/2 right-2 z-10 flex -translate-y-1/2 items-center">
            <Badge
              bgClass="bg-surface-page/40"
              className="px-2 py-0.5 text-xs font-medium"
            >
              {count}
            </Badge>
          </div>
        )}
      </div>
      <div className="text-fg col-start-2 flex flex-wrap items-center gap-2 text-sm">
        {names}
      </div>
    </div>
  );
};
Row.displayName = "BarVoteChart.Row";

const Name: React.FC<NameProps> = ({
  bgClass,
  className,
  children,
  ...rest
}) => {
  return (
    <Badge
      bgClass={bgClass ?? "bg-surface-inset"}
      className={clsx("border-line border whitespace-nowrap", className)}
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
