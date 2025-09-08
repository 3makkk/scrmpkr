import { useRoom } from "../hooks/useRoom";
import { useAuth } from "../AuthProvider";
import Button from "./ds/Button";

export default function RoomControls() {
  const { roomState, votedCount, allVoted, revealed, revealVotes, clearVotes } =
    useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isOwner = roomState.ownerId === account.id;

  if (!isOwner) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {!revealed && (
        <Button
          type="button"
          onClick={revealVotes}
          disabled={votedCount === 0}
          className="flex-1 max-w-xs"
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
        className={`${revealed ? "flex-1 max-w-md" : "flex-1 max-w-xs"}`}
      >
        Clear Votes
      </Button>
    </div>
  );
}
