import type { UserRole } from "@scrmpkr/shared";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../AuthProvider";
import LoginForm from "../components/auth/LoginForm";
import RoleSelectionForm from "../components/auth/RoleSelectionForm";
import ConfettiOverlay from "../components/core/effects/ConfettiOverlay";
import LoadingSpinner from "../components/core/layout/LoadingSpinner";
import PageLayout from "../components/core/layout/PageLayout";
import Button from "../components/ds/Button/Button";
import PrimaryActionZone from "../components/poker/voting/PrimaryActionZone";
import StateAwareSessionControls from "../components/room/controls/StateAwareSessionControls";
import RoomContextBar from "../components/room/header/RoomContextBar";
import ContextualTeamStatus from "../components/room/status/ContextualTeamStatus";
import { useRoom } from "../hooks/useRoom";

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

  if (error) {
    return (
      <PageLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <h2 className="text-danger mb-4 text-xl font-medium">Error</h2>
          <p className="text-fg-muted">{error}</p>
          <Button type="button" className="mt-6" onClick={() => navigate("/")}>
            Return Home
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Show loading while joining room
  if (isLoading || !roomState) {
    return (
      <PageLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="text-fg-muted mt-4">Joining room...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="flex flex-col lg:h-dvh">
      <ConfettiOverlay />

      {/* Room Context Bar - part of the outer frame, sits on the background */}
      <RoomContextBar />

      {/* Main content area with sidebar */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left sidebar - Contextual Team Status, part of the outer frame */}
        <aside className="lg:w-80 lg:shrink-0 lg:overflow-y-auto">
          <ContextualTeamStatus />
        </aside>

        {/* Right content - Primary Action Zone as the raised main card */}
        <main className="rounded-card border-line bg-surface-raised relative mx-3 mb-3 flex min-h-0 flex-1 flex-col border lg:ml-0">
          <div className="min-h-0 flex-1 overflow-y-auto pb-20">
            <PrimaryActionZone />
          </div>

          {/* State-Aware Session Controls - floating action button */}
          <StateAwareSessionControls />
        </main>
      </div>
    </PageLayout>
  );
}
