import { useRoom } from "../hooks/useRoom";
import Card from "./Card";

export default function ParticipantList() {
  const { roomState, progress } = useRoom();

  if (!roomState) return null;

  const { participants, ownerId } = roomState;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
        Participants
        <span className="ml-3 bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
          {participants.length}
        </span>
      </h2>
      <div className="space-y-3">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-white font-medium">{p.name}</span>
              {p.id === ownerId && (
                <span className="bg-blue-900 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  OWNER
                </span>
              )}
            </div>
            <div className="text-lg">
              {progress[p.id] ? (
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
              ) : (
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
