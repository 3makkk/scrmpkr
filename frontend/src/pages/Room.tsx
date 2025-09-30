import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { useRoom } from "../hooks/useRoom";
import LoginForm from "../components/LoginForm";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import RoomHeader from "../components/RoomHeader";
import ParticipantList from "../components/ParticipantList";
import VotingResults from "../components/VotingResults";
import VotingDeck from "../components/VotingDeck";
import RoomControls from "../components/RoomControls";
import ConfettiOverlay from "../components/ConfettiOverlay";
import Button from "../components/ds/Button/Button";
import { getSocket } from "../socket";

export default function Room() {
  const { roomId } = useParams();
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const normalizedRoomId = roomId ? roomId.trim().toLowerCase() : "";
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Use the room hook instead of managing state locally
  const { roomState, error, isLoading, revealed, clearVotes, joinRoom } =
    useRoom();

  // Join room when account and roomId are available
  useEffect(() => {
    if (!account || !normalizedRoomId) return;

    const cleanup = joinRoom(normalizedRoomId, account);

    // Return cleanup function
    return cleanup;
  }, [normalizedRoomId, account, joinRoom]);

  // Check if user is owner for the clear votes button
  const isOwner = roomState?.ownerId === account?.id;

  const handleReopen = () => {
    if (!account || !normalizedRoomId) return;
    setIsReopening(true);
    setReopenError(null);

    const s = getSocket({ name: account.name, userId: account.id });
    s.emit("room:create", { roomName: normalizedRoomId }, (response) => {
      setIsReopening(false);
      if ("error" in response) {
        setReopenError(response.error);
        return;
      }
      joinRoom(normalizedRoomId, account);
    });
  };

  // Don't render if no account
  if (!account) {
    return <LoginForm title="Scrum Poker" onLogin={login} />;
  }

  // Show error state with retry option
  if (error) {
    const canReopen =
      !!normalizedRoomId && error.includes("reopen") && !!account;
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div className="text-red-600 text-lg font-medium">{error}</div>
          {reopenError && (
            <div className="text-sm text-red-400">{reopenError}</div>
          )}
          <div className="space-y-4 w-full max-w-xs">
            {canReopen && (
              <Button
                type="button"
                onClick={handleReopen}
                disabled={isReopening}
              >
                {isReopening ? "Reopening..." : "Reopen Room"}
              </Button>
            )}
            <Button
              type="button"
              onClick={() => navigate("/")}
              variant="secondary"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show loading while joining room
  if (isLoading || !roomState) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Joining room...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="p-4">
      <ConfettiOverlay />
      <RoomHeader />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Participants Panel */}
        <div className="lg:col-span-1">
          <ParticipantList />
        </div>

        {/* Main Voting Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voting Results */}
          <VotingResults />

          {/* Voting Controls */}
          {!revealed && (
            <div className="space-y-6">
              <VotingDeck />
              <RoomControls />
            </div>
          )}

          {/* Clear votes button when revealed */}
          {revealed && isOwner && (
            <div className="flex justify-center">
              <Button type="button" onClick={clearVotes} variant="danger">
                Clear Votes
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
