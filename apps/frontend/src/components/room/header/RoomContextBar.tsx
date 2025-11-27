import { useNavigate } from "react-router-dom";
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
    <div className="bg-gray-800/50 border-b border-gray-700/50 px-4 py-3">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-medium text-white">
              Room {roomState.id}
            </h1>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-400">
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
