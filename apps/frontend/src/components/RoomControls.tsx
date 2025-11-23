import { useRoom } from "../hooks/useRoom";
import { useAuth } from "../AuthProvider";
import Button from "./ds/Button/Button";

export default function RoomControls() {
  const { roomState, votedCount, allVoted, revealVotes, clearVotes } =
    useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isRoundRevealed =
    roomState.currentRoundState?.status === "revealed" &&
    (roomState.currentRoundState?.votes.length ?? 0) > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {!isRoundRevealed && (
        <Button
          type="button"
          onClick={revealVotes}
          disabled={votedCount === 0}
          className="flex-1 max-w-xs"
          data-testid="reveal-votes-button"
        >
          Reveal Votes{" "}
          {allVoted
            ? "(All Voted)"
            : `(${votedCount}/${roomState.participants.length})`}
        </Button>
      )}
      <Button
        type="button"
        onClick={clearVotes}
        variant="danger"
        className={`${isRoundRevealed ? "flex-1 max-w-md" : "flex-1 max-w-xs"}`}
        data-testid="clear-votes-button"
      >
        Clear Votes
      </Button>
    </div>
  );
}
