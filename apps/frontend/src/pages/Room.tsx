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
import Card from "../components/ds/Card/Card";
import { getSocket } from "../socket";

export default function Room() {
  const { roomId } = useParams();
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const normalizedRoomId = roomId ? roomId.trim().toLowerCase() : "";
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Use the room hook instead of managing state locally
  const { roomState, error, isLoading, clearVotes, joinRoom } = useRoom();

  // Join room when account and roomId are available
  useEffect(() => {
    if (!account || !normalizedRoomId) return;

    const cleanup = joinRoom(normalizedRoomId, account);

    // Return cleanup function
    return cleanup;
  }, [normalizedRoomId, account, joinRoom]);

  // Check if user is owner for the clear votes button
  const isOwner = roomState?.ownerId === account?.id;
  const isRoundRevealed =
    roomState?.currentRoundState?.status === "revealed" &&
    (roomState?.currentRoundState?.votes.length ?? 0) > 0;

  const handleReopen = () => {
    if (!account || !normalizedRoomId) return;
    setIsReopening(true);
    setReopenError(null);

    const socket = getSocket({ name: account.name, userId: account.id });
    socket.emit("room:create", { roomName: normalizedRoomId }, (response) => {
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
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="w-full max-w-md text-center space-y-6">
            <div className="space-y-2">
              <div className="text-lg text-gray-400">{error}</div>
              {reopenError && (
                <div className="text-sm text-red-300">{reopenError}</div>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {canReopen && (
                <Button
                  type="button"
                  onClick={handleReopen}
                  disabled={isReopening}
                  className="sm:min-w-[150px]"
                >
                  {isReopening ? "Reopening..." : "Reopen Room"}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => navigate("/")}
                variant="secondary"
                className="sm:min-w-[150px]"
              >
                Back to Home
              </Button>
            </div>
          </Card>
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
          {!isRoundRevealed && (
            <div className="space-y-6">
              <VotingDeck />
              <RoomControls />
            </div>
          )}

          {/* Clear votes button when revealed */}
          {isRoundRevealed && isOwner && (
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
