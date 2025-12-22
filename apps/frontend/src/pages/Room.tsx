import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { useRoom } from "../hooks/useRoom";
import type { UserRole } from "@scrmpkr/shared";
import LoginForm from "../components/auth/LoginForm";
import RoleSelectionForm from "../components/auth/RoleSelectionForm";
import LoadingSpinner from "../components/core/layout/LoadingSpinner";
import PageLayout from "../components/core/layout/PageLayout";
import RoomContextBar from "../components/room/header/RoomContextBar";
import ContextualTeamStatus from "../components/room/status/ContextualTeamStatus";
import PrimaryActionZone from "../components/poker/voting/PrimaryActionZone";
import StateAwareSessionControls from "../components/room/controls/StateAwareSessionControls";
import ConfettiOverlay from "../components/core/effects/ConfettiOverlay";

export default function Room() {
  const { roomId } = useParams();
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const normalizedRoomId = roomId ? roomId.trim().toLowerCase() : "";
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Use the room hook instead of managing state locally
  const { roomState, error, isLoading, joinRoom } = useRoom();

  const handleRoleSelection = (role: UserRole) => {
    if (!account) return;

    console.log("[Room] Joining room:", { normalizedRoomId, role, account });
    setSelectedRole(role);
    joinRoom(normalizedRoomId, account, role);
  };

  const handleLoginWithRole = (name: string) => {
    login(name);
    // Don't set a default role - let the user choose via role selection form
  };

  // Don't render if no account
  if (!account) {
    return (
      <LoginForm
        title="Scrum Poker"
        onLogin={(name) => handleLoginWithRole(name)}
      />
    );
  }

  // Show role selection if needed (but not for room creators)
  if (account && !selectedRole) {
    return (
      <RoleSelectionForm
        roomId={normalizedRoomId}
        onJoin={handleRoleSelection}
        onCancel={() => navigate("/")}
      />
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

  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            type="button"
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
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
