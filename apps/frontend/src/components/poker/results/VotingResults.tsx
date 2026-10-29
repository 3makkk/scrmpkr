import { useRoom } from "../../../hooks/useRoom";
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
    <div className="p-6" data-testid="voting-results">
      <h2 className="animate-fade-in-scale mb-8 text-center text-2xl font-medium text-white">
        Voting Results
      </h2>

      <div className="animation-delay-100 animate-fade-in-down">
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
      <div className="animation-delay-400 animate-fade-in-scale mt-8 border-t border-gray-700/50 pt-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div data-testid="vote-average">
            <div className="mb-1 text-sm font-medium text-gray-400">
              Average
            </div>
            <div className="text-2xl font-semibold text-white">
              {stats.average}
            </div>
          </div>
          {stats.showMostCommon && (
            <div data-testid="vote-most-common">
              <div className="mb-1 text-sm font-medium text-gray-400">
                Most Common
              </div>
              <div className="text-2xl font-semibold text-white">
                {stats.mostCommon}
              </div>
            </div>
          )}
          <div data-testid="vote-consensus">
            <div className="mb-1 text-sm font-medium text-gray-400">
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
    </div>
  );
}
