import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";
import Button from "../../ds/Button/Button";

export default function StateAwareSessionControls() {
  const { roomState, votedCount, allVoted, revealVotes, clearVotes } =
    useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isRoundRevealed = roomState.currentRoundState?.status === "revealed";
  const hasVotes = (roomState.currentRoundState?.votes.length ?? 0) > 0;
  const isOwner = roomState.ownerId === account.id;

  // Only show controls when there's a clear action available
  const getAvailableActions = () => {
    const actions = [];

    // During voting phase - show reveal button if there are votes
    if (!isRoundRevealed && votedCount > 0) {
      const buttonText = allVoted
        ? "Reveal Votes (Everyone Voted!)"
        : `Reveal Votes (${votedCount}/${roomState.participants.length} voted)`;

      actions.push(
        <Button
          key="reveal"
          type="button"
          onClick={revealVotes}
          className="flex-1 max-w-sm"
          data-testid="reveal-votes-button"
        >
          {buttonText}
        </Button>,
      );
    }

    // After results are revealed - show clear votes to start new round
    if (isRoundRevealed && hasVotes) {
      actions.push(
        <Button
          key="clear"
          type="button"
          onClick={clearVotes}
          variant="primary"
          className="flex-1 max-w-sm"
          data-testid="clear-votes-button"
        >
          Start Next Round
        </Button>,
      );
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  // Don't render if no actions are available
  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-center space-x-4">{availableActions}</div>

        {/* Show helpful context about what the action will do */}
        <div className="text-center mt-2">
          {!isRoundRevealed && votedCount > 0 && (
            <p className="text-xs text-gray-400">
              {allVoted
                ? "All participants have voted. Ready to see the results!"
                : `${
                    roomState.participants.length - votedCount
                  } participants still voting...`}
            </p>
          )}

          {isRoundRevealed && hasVotes && (
            <p className="text-xs text-gray-400">
              Ready to start a new voting round with the same participants.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
