import type { RoundStats, RoundVote } from "@scrmpkr/shared";

export default class RoundStatsModel implements RoundStats {
  constructor(
    public average: string,
    public hasConsensus: boolean,
    public mostCommon: number | "?" | null,
    public showMostCommon: boolean,
  ) {}

  static fromVotes(votes: RoundVote[]): RoundStatsModel {
    const definedVotes = votes.filter(
      (vote): vote is Required<Pick<RoundVote, "id" | "name" | "value">> =>
        vote.value !== undefined,
    );
    const numericVotes = definedVotes
      .filter((vote) => typeof vote.value === "number")
      .map((vote) => vote.value as number);

    const average =
      numericVotes.length > 0
        ? (
            numericVotes.reduce((sum, numberValue) => sum + numberValue, 0) /
            numericVotes.length
          ).toFixed(1)
        : "N/A";

    const values = definedVotes.map((vote) => vote.value as number | "?");
    const hasConsensus = values.length > 0 && new Set(values).size === 1;

    const isAllNonNumeric =
      values.length > 0 && values.every((value) => typeof value !== "number");
    const frequency = values.reduce<Record<string, number>>(
      (accumulator, v) => {
        const key = String(v);
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
    const maxCount = Object.values(frequency).reduce(
      (maxValue, count) => (count > maxValue ? count : maxValue),
      0,
    );
    const modes = Object.entries(frequency)
      .filter(([, count]) => count === maxCount)
      .map(([valueKey]) => valueKey);
    const showMostCommon =
      values.length > 0 && !isAllNonNumeric && modes.length === 1;
    const mostCommon = showMostCommon
      ? ((Number.isNaN(Number(modes[0])) ? "?" : Number(modes[0])) ?? null)
      : null;

    return new RoundStatsModel(
      average,
      hasConsensus,
      mostCommon,
      showMostCommon,
    );
  }
}
