import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";
import VotingDeck from "./VotingDeck";
import VotingResults from "../results/VotingResults";

export default function PrimaryActionZone() {
  const { roomState } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isRoundRevealed = roomState.currentRoundState?.status === "revealed";
  const hasVotes = (roomState.currentRoundState?.votes.length ?? 0) > 0;

  // Show results when revealed and there are votes, otherwise show voting deck
  if (isRoundRevealed && hasVotes) {
    return (
      <div className="px-4 py-6 pb-8">
        <div className="mx-auto max-w-4xl">
          <VotingResults />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-8">
      <div className="mx-auto max-w-4xl">
        <VotingDeck />
      </div>
    </div>
  );
}
