import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";
import { type Participant, UserRole, canVote } from "@scrmpkr/shared";

export default function ContextualTeamStatus() {
  const { roomState } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const { participants, currentRoundState } = roomState;
  const isRoundRevealed = currentRoundState?.status === "revealed";

  // Voters (participant role) are the "Active Participants" list.
  const activeParticipants = participants.filter((p) => canVote(p.role));
  const visitors = participants.filter((p) => p.role === UserRole.VISITOR);
  const facilitators = participants.filter(
    (p) => p.role === UserRole.FACILITATOR,
  );
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
      case UserRole.FACILITATOR:
        return "🎬 Facilitator";
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

        {/* Facilitators - non-voting session managers */}
        {facilitators.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-400 text-sm uppercase tracking-wider">
              Facilitators (
              <span data-testid="facilitator-count">{facilitators.length}</span>)
            </h3>
            <div className="flex flex-wrap gap-2 lg:block lg:space-y-3">
              {facilitators.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex w-auto animate-slide-in-left items-center justify-between rounded-lg border border-amber-700/40 bg-amber-900/20 p-3 lg:w-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`facilitator-${participant.name}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <div className="flex flex-col">
                      <span
                        className={`font-medium text-sm ${
                          participant.id === account.id
                            ? "text-amber-400"
                            : "text-gray-300"
                        }`}
                        data-testid={`facilitator-name-${participant.name}`}
                      >
                        {participant.id === account.id
                          ? "You"
                          : participant.name}
                        <span className="ml-1 text-amber-500 text-xs">🎬</span>
                      </span>
                      <span className="text-gray-500 text-xs">managing</span>
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
