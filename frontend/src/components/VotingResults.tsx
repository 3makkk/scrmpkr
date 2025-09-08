import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import { useVotingStats } from "../hooks/useVotingStats";
import BarVoteChart, { type BarVoteItem } from "./ds/BarVoteChart";

export default function VotingResults() {
  const { revealed, roomState } = useRoom();

  const { average, hasConsensus, showMostCommon, mostCommon } =
    useVotingStats(revealed);

  if (!revealed || !roomState) return null;

  // Group votes by value -> list of names
  const nameOf = (id: string) =>
    roomState.participants.find((p) => p.id === id)?.name || id;

  const numericGroups = new Map<number, string[]>();
  const unknownGroup: string[] = [];

  for (const r of revealed) {
    if (typeof r.value === "number") {
      const arr = numericGroups.get(r.value) ?? [];
      arr.push(nameOf(r.id));
      numericGroups.set(r.value, arr);
    } else {
      unknownGroup.push(nameOf(r.id));
    }
  }

  const items: BarVoteItem[] = [
    ...Array.from(numericGroups.entries()).map(([value, names]) => ({
      value,
      names,
    })),
    ...(unknownGroup.length > 0
      ? [
          {
            value: "?",
            names: unknownGroup,
          } as BarVoteItem,
        ]
      : []),
  ];

  return (
    <Card className="animate-fade-in">
      <h2 className="text-2xl font-medium text-white mb-8 text-center">
        Voting Results
      </h2>

      <BarVoteChart items={items} sortBy="value" order="desc" showCount />

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-700/50">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-gray-400 text-sm font-medium mb-1">
              Average
            </div>
            <div className="text-2xl font-semibold text-white">{average}</div>
          </div>
          {showMostCommon && (
            <div>
              <div className="text-gray-400 text-sm font-medium mb-1">
                Most Common
              </div>
              <div className="text-2xl font-semibold text-white">
                {mostCommon}
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-400 text-sm font-medium mb-1">
              Consensus
            </div>
            <div
              className={`text-2xl font-semibold ${
                hasConsensus ? "text-green-400" : "text-red-400"
              }`}
            >
              {hasConsensus ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
