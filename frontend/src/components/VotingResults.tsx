import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import { useVotingStats } from "../hooks/useVotingStats";

export default function VotingResults() {
  const { revealed, roomState } = useRoom();

  if (!revealed || !roomState) return null;

  const { participants } = roomState;
  const { average, hasConsensus, showMostCommon, mostCommon } =
    useVotingStats(revealed);

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
          {showMostCommon && (
            <div>
              <div className="text-slate-300 text-sm font-light">
                Most Common
              </div>
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
