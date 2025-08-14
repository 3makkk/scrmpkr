import React from "react";
import { useRoom } from "../hooks/useRoom";
import { useAuth } from "../AuthProvider";
import Card from "./Card";

export default function RoomControls() {
  const { roomState, votedCount, allVoted, revealed, revealVotes, clearVotes } =
    useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isOwner = roomState.ownerId === account.id;

  if (!isOwner) return null;

  return (
    <Card>
      <h2 className="text-xl font-light text-white mb-4 text-center">
        Room Controls
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!revealed && (
          <button
            onClick={revealVotes}
            disabled={votedCount === 0}
            className="btn flex-1 max-w-xs"
          >
            Reveal Votes{" "}
            {allVoted
              ? "(All Voted)"
              : `(${votedCount}/${roomState.participants.length})`}
          </button>
        )}
        <button
          onClick={clearVotes}
          className={`btn-danger ${
            revealed ? "flex-1 max-w-md" : "flex-1 max-w-xs"
          }`}
        >
          Clear Votes
        </button>
      </div>
    </Card>
  );
}
