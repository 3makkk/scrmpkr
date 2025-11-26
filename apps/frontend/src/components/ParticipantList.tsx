import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import Badge from "./ds/Badge/Badge";

export default function ParticipantList() {
  const { roomState } = useRoom();

  if (!roomState) return null;

  const { participants, ownerId } = roomState;

  return (
    <Card data-testid="participant-list" className="animation-delay-300">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
        Participants
        <Badge
          bgClass="bg-blue-600"
          rounded="full"
          className="ml-3 text-sm font-medium"
          data-testid="participant-count"
        >
          {participants.length}
        </Badge>
      </h2>
      <div className="space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors"
            data-testid={`participant-${participant.name}`}
          >
            <div className="flex items-center space-x-3">
              <span
                className="text-white font-medium"
                data-testid={`participant-name-${participant.name}`}
              >
                {participant.name}
              </span>
              {participant.id === ownerId && (
                <Badge
                  bgClass="bg-blue-900"
                  rounded="full"
                  className="text-xs font-semibold px-2 py-1"
                  data-testid={`participant-owner-${participant.name}`}
                >
                  OWNER
                </Badge>
              )}
            </div>
            <div className="text-lg">
              {participant.hasVoted ? (
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
