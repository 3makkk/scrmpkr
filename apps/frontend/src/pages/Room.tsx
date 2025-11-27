import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { useRoom } from "../hooks/useRoom";
import LoginForm from "../components/auth/LoginForm";
import LoadingSpinner from "../components/core/layout/LoadingSpinner";
import PageLayout from "../components/core/layout/PageLayout";
import RoomContextBar from "../components/room/header/RoomContextBar";
import ContextualTeamStatus from "../components/room/status/ContextualTeamStatus";
import PrimaryActionZone from "../components/poker/voting/PrimaryActionZone";
import StateAwareSessionControls from "../components/room/controls/StateAwareSessionControls";
import ConfettiOverlay from "../components/core/effects/ConfettiOverlay";
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
    <PageLayout className="flex flex-col min-h-screen">
      <ConfettiOverlay />

      {/* Main content area - scrollable */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Room Context Bar - Always visible at top */}
        <RoomContextBar />

        {/* Main content area with sidebar */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Left sidebar - Contextual Team Status */}
          <div className="lg:w-80 lg:shrink-0 border-r border-gray-700/30 bg-gray-900/20">
            <ContextualTeamStatus />
          </div>

          {/* Right content - Primary Action Zone */}
          <div className="flex-1 overflow-y-auto">
            <PrimaryActionZone />
          </div>
        </div>
      </div>

      {/* State-Aware Session Controls - Sticky footer, always visible */}
      <StateAwareSessionControls />
    </PageLayout>
  );
}
