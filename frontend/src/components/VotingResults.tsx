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
      <h2 className="text-2xl font-light text-white mb-6 text-center">
        Voting Results
      </h2>

      <BarVoteChart items={items} sortBy="value" order="desc" showCount />

      {/* Statistics */}
      <div className="mt-6 pt-6 border-t border-slate-500/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-slate-300 text-sm font-light">Average</div>
            <div className="text-lg font-medium text-white">{average}</div>
          </div>
          {showMostCommon && (
            <div>
              <div className="text-slate-300 text-sm font-light">Most Common</div>
              <div className="text-lg font-medium text-white">{mostCommon}</div>
            </div>
          )}
          <div>
            <div className="text-slate-300 text-sm font-light">Consensus</div>
            <div className="text-lg font-medium text-white">
              {hasConsensus ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
