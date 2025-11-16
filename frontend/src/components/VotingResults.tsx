import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import BarVoteChart from "./ds/BarVoteChart/BarVoteChart";

export default function VotingResults() {
  const { roomState } = useRoom();
  const revealedVotes =
    roomState?.currentRoundState?.status === "revealed"
      ? roomState.currentRoundState?.votes
      : null;
  const stats =
    roomState?.currentRoundState?.status === "revealed"
      ? roomState.currentRoundState.stats
      : null;

  if (!revealedVotes || !stats) return null;

  const numericGroups = new Map<number, string[]>();
  const unknownGroup: string[] = [];

  for (const revealedVote of revealedVotes) {
    const voterName = revealedVote.name ?? revealedVote.id;
    if (typeof revealedVote.value === "number") {
      const voteList = numericGroups.get(revealedVote.value) ?? [];
      voteList.push(voterName);
      numericGroups.set(revealedVote.value, voteList);
    } else {
      unknownGroup.push(voterName);
    }
  }

  return (
    <Card className="animate-fade-in">
      <h2 className="text-2xl font-medium text-white mb-8 text-center">
        Voting Results
      </h2>

      <BarVoteChart numberOfVoters={revealedVotes.length}>
        {Array.from(numericGroups.keys())
          .sort((a, b) => b - a)
          .map((value) => (
            <BarVoteChart.Row key={value} value={value}>
              {(numericGroups.get(value) ?? []).map((voterName) => (
                <BarVoteChart.Name key={voterName}>
                  {voterName}
                </BarVoteChart.Name>
              ))}
            </BarVoteChart.Row>
          ))}
        {unknownGroup.length > 0 && (
          <BarVoteChart.Row value="?">
            {unknownGroup.map((voterName) => (
              <BarVoteChart.Name key={voterName}>{voterName}</BarVoteChart.Name>
            ))}
          </BarVoteChart.Row>
        )}
      </BarVoteChart>

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-700/50">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-gray-400 text-sm font-medium mb-1">
              Average
            </div>
            <div className="text-2xl font-semibold text-white">
              {stats.average}
            </div>
          </div>
          {stats.showMostCommon && (
            <div>
              <div className="text-gray-400 text-sm font-medium mb-1">
                Most Common
              </div>
              <div className="text-2xl font-semibold text-white">
                {stats.mostCommon}
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-400 text-sm font-medium mb-1">
              Consensus
            </div>
            <div
              className={`text-2xl font-semibold ${
                stats.hasConsensus ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats.hasConsensus ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
