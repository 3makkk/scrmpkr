import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";
import { UserRole } from "@scrmpkr/shared";
import { shouldShowSessionControls } from "../../../utils/ui-permissions";
import Button from "../../ds/Button/Button";

export default function StateAwareSessionControls() {
  const { roomState, revealVotes, clearVotes } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isRoundRevealed = roomState.currentRoundState?.status === "revealed";
  const hasVotes = (roomState.currentRoundState?.votes.length ?? 0) > 0;

  // Check if current user can perform actions using the centralized ACL
  const currentUser = roomState.participants.find((p) => p.id === account.id);
  const canControl = currentUser?.role
    ? shouldShowSessionControls(currentUser.role)
    : false;

  // Filter active participants (exclude visitors) for counting
  const activeParticipants = roomState.participants.filter(
    (p) => p.role !== UserRole.VISITOR,
  );
  const votedActiveParticipants = activeParticipants.filter(
    (p) => p.hasVoted,
  ).length;
  const allActiveVoted =
    activeParticipants.length > 0 &&
    activeParticipants.every((p) => p.hasVoted);

  // Only show controls when there's a clear action available and user has permissions
  const getAvailableActions = (): React.ReactElement[] => {
    const actions: React.ReactElement[] = [];

    // Only owners can reveal or clear votes
    if (!canControl) return actions;

    // During voting phase - show reveal button if there are votes
    if (!isRoundRevealed && votedActiveParticipants > 0) {
      const buttonText = allActiveVoted
        ? "Reveal Votes (Everyone Voted!)"
        : `Reveal Votes (${votedActiveParticipants}/${activeParticipants.length} voted)`;

      actions.push(
        <Button
          key="reveal"
          type="button"
          onClick={revealVotes}
          className="max-w-sm flex-1"
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
          className="max-w-sm flex-1"
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
    <div className="sticky bottom-0 border-gray-700/50 border-t bg-gray-900/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex justify-center space-x-4">{availableActions}</div>

        {/* Show helpful context about what the action will do */}
        <div className="mt-2 text-center">
          {!canControl && (
            <p className="text-gray-500 text-xs">
              Only participants and room owners can control voting sessions
            </p>
          )}
          {canControl && !isRoundRevealed && votedActiveParticipants > 0 && (
            <p className="text-gray-400 text-xs" data-testid="voting-progress">
              {allActiveVoted
                ? "All participants have voted. Ready to see the results!"
                : `${
                    activeParticipants.length - votedActiveParticipants
                  } participants still voting...`}
            </p>
          )}

          {canControl && isRoundRevealed && hasVotes && (
            <p className="text-gray-400 text-xs">
              Ready to start a new voting round with the same participants.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
