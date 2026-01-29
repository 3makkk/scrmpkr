import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";
import { type Participant, UserRole } from "@scrmpkr/shared";

export default function ContextualTeamStatus() {
  const { roomState } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const { participants, currentRoundState } = roomState;
  const isRoundRevealed = currentRoundState?.status === "revealed";

  // Filter out visitors from participant counting and display
  const activeParticipants = participants.filter(
    (p) => p.role !== UserRole.VISITOR,
  );
  const visitors = participants.filter((p) => p.role === UserRole.VISITOR);
  const votedActiveParticipants = activeParticipants.filter(
    (p) => p.hasVoted,
  ).length;

  const getParticipantStatus = (participant: Participant) => {
    if (participant.role === UserRole.VISITOR) {
      return "observing";
    }
    if (isRoundRevealed) {
      const vote = currentRoundState?.votes.find(
        (v) => v.id === participant.id,
      );
      return vote ? String(vote.value) : "—";
    } else if (participant.hasVoted) {
      return "voted";
    } else {
      return "thinking";
    }
  };

  const getParticipantIndicator = (participant: Participant) => {
    if (participant.role === UserRole.VISITOR) {
      return <div className="h-3 w-3 rounded-full bg-purple-500"></div>;
    }
    if (isRoundRevealed) {
      const vote = currentRoundState?.votes.find(
        (v) => v.id === participant.id,
      );
      if (vote) {
        return (
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 font-bold text-white text-xs"></div>
        );
      }
      return <div className="h-3 w-3 rounded-full bg-gray-600"></div>;
    } else if (participant.hasVoted) {
      return <div className="h-3 w-3 rounded-full bg-green-500"></div>;
    } else {
      return (
        <div className="h-3 w-3 animate-pulse rounded-full bg-gray-600"></div>
      );
    }
  };

  const getRoleDisplay = (participant: Participant) => {
    switch (participant.role) {
      case UserRole.VISITOR:
        return "👁 Visitor";
      default:
        return "";
    }
  };

  return (
    <div className="h-full max-h-64 overflow-y-auto p-4 lg:max-h-none">
      <div className="space-y-6">
        {/* Active Participants - Only those who can vote */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-400 text-sm uppercase tracking-wider">
            Active Participants (
            <span data-testid="active-participant-count">
              {votedActiveParticipants}/{activeParticipants.length}
            </span>
            )
            <span data-testid="participant-count" className="sr-only">
              {participants.length}
            </span>
          </h3>
          <div className="flex flex-wrap gap-2 lg:block lg:space-y-3">
            {activeParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className={`flex w-auto animate-slide-in-left items-center justify-between rounded-lg border border-gray-700/40 bg-gray-800/40 p-3 lg:w-full`}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`participant-${participant.name}`}
              >
                <div className="flex items-center space-x-3">
                  {getParticipantIndicator(participant)}
                  <div className="flex flex-col">
                    <span
                      className={`font-medium text-sm ${
                        participant.id === account.id
                          ? "text-blue-400"
                          : "text-gray-300"
                      }`}
                      data-testid={`participant-name-${participant.name}`}
                    >
                      {participant.id === account.id ? "You" : participant.name}
                      {getRoleDisplay(participant) && (
                        <span className="ml-1 text-gray-400 text-xs">
                          {getRoleDisplay(participant)}
                        </span>
                      )}
                    </span>
                    {!isRoundRevealed && (
                      <span className="text-gray-500 text-xs">
                        {getParticipantStatus(participant)}
                      </span>
                    )}
                    {isRoundRevealed && (
                      <span className="text-gray-400 text-xs">
                        Vote: {getParticipantStatus(participant)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visitors - Separate section */}
        {visitors.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-400 text-sm uppercase tracking-wider">
              Visitors (
              <span data-testid="visitor-count">{visitors.length}</span>)
            </h3>
            <div className="flex flex-wrap gap-2 lg:block lg:space-y-3">
              {visitors.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex w-auto animate-slide-in-left items-center justify-between rounded-lg border border-purple-700/40 bg-purple-900/20 p-3 lg:w-full`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`visitor-${participant.name}`}
                >
                  <div className="flex items-center space-x-3">
                    {getParticipantIndicator(participant)}
                    <div className="flex flex-col">
                      <span
                        className={`font-medium text-sm ${
                          participant.id === account.id
                            ? "text-purple-400"
                            : "text-gray-300"
                        }`}
                        data-testid={`visitor-name-${participant.name}`}
                      >
                        {participant.id === account.id
                          ? "You"
                          : participant.name}
                        <span className="ml-1 text-purple-500 text-xs">👁</span>
                      </span>
                      <span className="text-gray-500 text-xs">
                        {getParticipantStatus(participant)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
