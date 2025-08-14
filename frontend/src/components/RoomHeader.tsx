import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import Card from "./Card";

export default function RoomHeader() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { roomState, votedCount, leaveRoom } = useRoom();

  const handleLeave = () => {
    leaveRoom(() => navigate("/"));
  };

  if (!roomState) return null;

  return (
    <div className="max-w-6xl mx-auto mb-8">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">
              Room {roomId}
            </h1>
            <p className="text-white/70">
              {votedCount} of {roomState.participants.length} participants voted
            </p>
          </div>
          <button onClick={handleLeave} className="btn-secondary">
            Leave Room
          </button>
        </div>
      </Card>
    </div>
  );
}
