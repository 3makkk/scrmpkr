import { useRoom } from "../hooks/useRoom";
import Card from "./Card";

export default function ParticipantList() {
  const { roomState, progress } = useRoom();

  if (!roomState) return null;

  const { participants, ownerId } = roomState;

  return (
    <Card>
      <h2 className="text-lg font-medium text-white mb-6 flex items-center">
        Participants
        <span className="ml-2 bg-slate-600 text-white text-sm px-2 py-1 rounded-full">
          {participants.length}
        </span>
      </h2>
      <div className="space-y-3">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-white/5 rounded-lg p-3"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium">{p.name}</span>
              {p.id === ownerId && (
                <span className="bg-slate-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  OWNER
                </span>
              )}
            </div>
            <div className="text-lg">
              {progress[p.id] ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
