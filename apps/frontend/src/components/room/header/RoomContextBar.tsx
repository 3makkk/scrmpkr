import { useNavigate } from "react-router";
import { useRoom } from "../../../hooks/useRoom";
import AccountIndicator from "../../auth/AccountIndicator";
import Button from "../../ds/Button/Button";

export default function RoomContextBar() {
  const navigate = useNavigate();
  const { roomState, leaveRoom } = useRoom();

  const handleLeave = () => {
    leaveRoom(() => navigate("/"));
  };

  if (!roomState) return null;

  return (
    <div className="px-4 py-3">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <h1 className="text-fg text-xl font-medium">Room {roomState.id}</h1>
          </div>

          <div className="text-fg-muted flex items-center space-x-4 text-sm">
            <span>Round {roomState.currentRound}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <AccountIndicator />

          <Button
            type="button"
            onClick={handleLeave}
            variant="secondary"
            className="text-sm"
            data-testid="leave-room-button"
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
