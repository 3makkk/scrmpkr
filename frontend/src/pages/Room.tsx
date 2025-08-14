import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { useRoom } from "../hooks/useRoom";
import LoginForm from "../components/LoginForm";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import RoomHeader from "../components/RoomHeader";
import ParticipantList from "../components/ParticipantList";
import CountdownTimer from "../components/CountdownTimer";
import VotingResults from "../components/VotingResults";
import VotingDeck from "../components/VotingDeck";
import RoomControls from "../components/RoomControls";

export default function Room() {
  const { roomId } = useParams();
  const { account, login } = useAuth();
  const navigate = useNavigate();

  // Use the room hook instead of managing state locally
  const {
    roomState,
    error,
    isLoading,
    revealed,
    clearVotes,
    joinRoom,
    retryJoin,
  } = useRoom();

  // Join room when account and roomId are available
  useEffect(() => {
    if (!account || !roomId) return;

    const cleanup = joinRoom(roomId, account);

    // Return cleanup function
    return cleanup;
  }, [roomId, account, joinRoom]);

  // Helper functions
  const handleRetryJoin = () => {
    if (roomId && account) {
      retryJoin(roomId, account);
    }
  };

  // Check if user is owner for the clear votes button
  const isOwner = roomState?.ownerId === account?.id;

  // Don't render if no account
  if (!account) {
    return <LoginForm title="Scrum Poker" onLogin={login} />;
  }

  // Show error state with retry option
  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div className="text-red-600 text-lg font-medium">{error}</div>
          <div className="space-y-4">
            <button
              onClick={handleRetryJoin}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-4"
            >
              Back to Home
            </button>
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
      <RoomHeader />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Participants Panel */}
        <div className="lg:col-span-1">
          <ParticipantList />
        </div>

        {/* Main Voting Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Countdown Timer */}
          <CountdownTimer />

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
              <button
                onClick={clearVotes}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Clear Votes
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
