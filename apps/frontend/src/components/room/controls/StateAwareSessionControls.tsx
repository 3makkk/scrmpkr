import { canVote } from "@scrmpkr/shared";
import clsx from "clsx";
import { useAuth } from "../../../AuthProvider";
import { useRoom } from "../../../hooks/useRoom";
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

  // Only voters (participant role) count toward the reveal denominator.
  const activeParticipants = roomState.participants.filter((p) =>
    canVote(p.role),
  );
  const votedActiveParticipants = activeParticipants.filter(
    (p) => p.hasVoted,
  ).length;
  const allActiveVoted =
    activeParticipants.length > 0 &&
    activeParticipants.every((p) => p.hasVoted);

  // Only one action applies at a time, so the controls are a single floating button
  const getAvailableAction = (): React.ReactElement | null => {
    // Only owners can reveal or clear votes
    if (!canControl) return null;

    // During voting phase - show reveal button if there are votes
    if (!isRoundRevealed && votedActiveParticipants > 0) {
      return (
        <Button
          type="button"
          onClick={revealVotes}
          className={clsx(
            "flex items-center gap-3 rounded-full! shadow-xl shadow-blue-950/50",
            allActiveVoted && "animate-glow-pulse",
          )}
          data-testid="reveal-votes-button"
        >
          Reveal votes
          <span
            className="rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums"
            data-testid="voting-progress"
          >
            {votedActiveParticipants}/{activeParticipants.length}
            <span className="sr-only"> voted</span>
          </span>
        </Button>
      );
    }

    // After results are revealed - show clear votes to start new round
    if (isRoundRevealed && hasVotes) {
      return (
        <Button
          type="button"
          onClick={clearVotes}
          variant="primary"
          className="rounded-full! shadow-xl shadow-blue-950/50"
          data-testid="clear-votes-button"
        >
          Start Next Round
        </Button>
      );
    }

    return null;
  };

  const availableAction = getAvailableAction();

  // Don't render if no action is available
  if (!availableAction) {
    return null;
  }

  return (
    <div className="animate-fade-in-scale fixed bottom-4 left-1/2 z-20 -translate-x-1/2 lg:absolute lg:bottom-6">
      {availableAction}
    </div>
  );
}
