import { motion } from "framer-motion";
import { motionVariants } from "../../ds/Motion/Motion";
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
      <motion.h2
        className="text-2xl font-medium text-white mb-8 text-center"
        variants={motionVariants.fadeIn}
        initial="hidden"
        animate="visible"
      >
        Voting Results
      </motion.h2>

      <motion.div
        variants={motionVariants.slideInFromBottom}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <BarVoteChart numberOfVoters={revealedVotes.length}>
          {Array.from(numericGroups.keys())
            .sort((a, b) => b - a)
            .map((value, index) => (
              <motion.div
                key={value}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.2 + index * 0.05,
                }}
              >
                <BarVoteChart.Row value={value}>
                  {(numericGroups.get(value) ?? []).map((voterName) => (
                    <BarVoteChart.Name key={voterName}>
                      {voterName}
                    </BarVoteChart.Name>
                  ))}
                </BarVoteChart.Row>
              </motion.div>
            ))}
          {unknownGroup.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + numericGroups.size * 0.05 }}
            >
              <BarVoteChart.Row value="?">
                {unknownGroup.map((voterName) => (
                  <BarVoteChart.Name key={voterName}>
                    {voterName}
                  </BarVoteChart.Name>
                ))}
              </BarVoteChart.Row>
            </motion.div>
          )}
        </BarVoteChart>
      </motion.div>

      {/* Statistics */}
      <motion.div
        className="mt-8 pt-6 border-t border-gray-700/50"
        variants={motionVariants.fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
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
      </motion.div>
    </Card>
  );
}
