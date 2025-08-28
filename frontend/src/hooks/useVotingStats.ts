import { useMemo } from "react";
import type { RevealedVote } from "@scrmpkr/shared";

type Value = number | "?";

type VotingStats = {
  average: string;
  hasConsensus: boolean;
  mostCommon: Value | null;
  showMostCommon: boolean;
};

// Pure helpers (small, focused, testable)
const toValues = (revealed: RevealedVote[] | null): Value[] =>
  (revealed ?? [])
    .filter((r): r is { id: string; value: Value } => r.value !== undefined)
    .map((r) => r.value);

const averageOf = (nums: number[]): string =>
  nums.length > 0
    ? (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1)
    : "N/A";

const hasConsensusOn = (values: Value[]): boolean =>
  values.length > 0 && new Set(values).size === 1;

const isAllNonNumeric = (values: Value[]): boolean =>
  values.length > 0 && values.every((v) => typeof v !== "number");

const frequencies = (values: Value[]): Record<string, number> =>
  values.reduce<Record<string, number>>((acc, v) => {
    const key = String(v);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

const maxCountOf = (freq: Record<string, number>): number =>
  Object.values(freq).reduce((m, c) => (c > m ? c : m), 0);

const modesFor = (freq: Record<string, number>, max: number): string[] =>
  Object.entries(freq)
    .filter(([, c]) => c === max)
    .map(([k]) => k);

const parseValueKey = (k: string): Value =>
  Number.isNaN(Number(k)) ? (k as "?") : (Number(k) as number);

const computeMostCommon = (
  values: Value[],
): { showMostCommon: boolean; mostCommon: Value | null } => {
  const freq = frequencies(values);
  const max = maxCountOf(freq);
  const modes = modesFor(freq, max);
  const show =
    values.length > 0 && !isAllNonNumeric(values) && modes.length === 1;

  return {
    showMostCommon: show,
    mostCommon: show ? parseValueKey(modes[0]!) : null,
  };
};

export function useVotingStats(revealed: RevealedVote[] | null): VotingStats {
  return useMemo(() => {
    const values = toValues(revealed);
    const average = averageOf(
      values.filter((v): v is number => typeof v === "number"),
    );
    const hasConsensus = hasConsensusOn(values);
    const { showMostCommon, mostCommon } = computeMostCommon(values);
    return { average, hasConsensus, mostCommon, showMostCommon };
  }, [revealed]);
}
