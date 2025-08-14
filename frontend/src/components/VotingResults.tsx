import { useRoom } from "../hooks/useRoom";
import Card from "./Card";

export default function VotingResults() {
  const { revealed, roomState } = useRoom();

  if (!revealed || !roomState) return null;

  const { participants } = roomState;

  const numericVotes = revealed.filter((r) => typeof r.value === "number") as {
    id: string;
    value: number;
  }[];
  const average =
    numericVotes.length > 0
      ? (
          numericVotes.reduce((sum, r) => sum + r.value, 0) /
          numericVotes.length
        ).toFixed(1)
      : "N/A";

  const mostCommon =
    revealed.length > 0
      ? revealed.reduce((a, b) =>
          revealed.filter((v) => v.value === a.value).length >=
          revealed.filter((v) => v.value === b.value).length
            ? a
            : b,
        ).value
      : "N/A";

  const hasConsensus = new Set(revealed.map((r) => r.value)).size === 1;

  return (
    <Card className="animate-fade-in">
      <h2 className="text-2xl font-light text-white mb-6 text-center">
        Voting Results
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {revealed.map((r) => (
          <div
            key={r.id}
            className="bg-slate-500/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-slate-500/30"
          >
            <div className="text-white/80 text-sm mb-2">
              {participants.find((p) => p.id === r.id)?.name || r.id}
            </div>
            <div className="text-3xl font-bold text-white">{r.value}</div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-6 pt-6 border-t border-slate-500/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-slate-300 text-sm font-light">Average</div>
            <div className="text-lg font-medium text-white">{average}</div>
          </div>
          <div>
            <div className="text-slate-300 text-sm font-light">Most Common</div>
            <div className="text-lg font-medium text-white">{mostCommon}</div>
          </div>
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
