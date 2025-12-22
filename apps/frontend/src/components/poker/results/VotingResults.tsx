import { useRoom } from "../../../hooks/useRoom";
import Card from "../shared/Card";
import BarVoteChart from "../../ds/BarVoteChart/BarVoteChart";

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
    <Card data-testid="voting-results">
      <h2 className="text-2xl font-medium text-white mb-8 text-center animate-fade-in-scale">
        Voting Results
      </h2>

      <div className="animate-fade-in-down animation-delay-100">
        <BarVoteChart numberOfVoters={revealedVotes.length}>
          {Array.from(numericGroups.keys())
            .sort((a, b) => b - a)
            .map((value, index) => (
              <div
                key={value}
                className={`animate-fade-in-scale`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <BarVoteChart.Row value={value}>
                  {(numericGroups.get(value) ?? []).map((voterName) => (
                    <BarVoteChart.Name key={voterName}>
                      {voterName}
                    </BarVoteChart.Name>
                  ))}
                </BarVoteChart.Row>
              </div>
            ))}
          {unknownGroup.length > 0 && (
            <div
              className={`animate-fade-in-scale`}
              style={{ animationDelay: `${200 + numericGroups.size * 50}ms` }}
            >
              <BarVoteChart.Row value="?">
                {unknownGroup.map((voterName) => (
                  <BarVoteChart.Name key={voterName}>
                    {voterName}
                  </BarVoteChart.Name>
                ))}
              </BarVoteChart.Row>
            </div>
          )}
        </BarVoteChart>
      </div>

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-700/50 animate-fade-in-scale animation-delay-400">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div data-testid="vote-average">
            <div className="text-gray-400 text-sm font-medium mb-1">
              Average
            </div>
            <div className="text-2xl font-semibold text-white">
              {stats.average}
            </div>
          </div>
          {stats.showMostCommon && (
            <div data-testid="vote-most-common">
              <div className="text-gray-400 text-sm font-medium mb-1">
                Most Common
              </div>
              <div className="text-2xl font-semibold text-white">
                {stats.mostCommon}
              </div>
            </div>
          )}
          <div data-testid="vote-consensus">
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
