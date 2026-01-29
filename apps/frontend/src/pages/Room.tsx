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
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Joining room...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <h2 className="mb-4 font-semibold text-red-600 text-xl">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            type="button"
            className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="flex min-h-screen flex-col">
      <ConfettiOverlay />

      {/* Main content area - scrollable */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Room Context Bar - Always visible at top */}
        <RoomContextBar />

        {/* Main content area with sidebar */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Left sidebar - Contextual Team Status */}
          <div className="border-gray-700/30 border-r bg-gray-900/20 lg:w-80 lg:shrink-0">
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
