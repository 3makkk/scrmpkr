import { useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import Button from "./ds/Button/Button";

export default function RoomHeader() {
  const navigate = useNavigate();
  const { roomState, votedCount, leaveRoom } = useRoom();

  const handleLeave = () => {
    leaveRoom(() => navigate("/"));
  };

  if (!roomState) return null;

  return (
    <div className="max-w-6xl mx-auto mb-8">
      <Card className="animation-delay-150">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-medium text-white mb-2"
              data-testid="room-title"
            >
              Room {roomState.id}
            </h1>
            <p className="text-gray-400" data-testid="voting-progress">
              {votedCount} of {roomState.participants.length} participants voted
            </p>
          </div>
          <Button
            type="button"
            onClick={handleLeave}
            variant="secondary"
            data-testid="leave-room-button"
          >
            Leave Room
          </Button>
        </div>
      </Card>
    </div>
  );
}
