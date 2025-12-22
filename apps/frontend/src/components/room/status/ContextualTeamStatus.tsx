import { motion, AnimatePresence } from "framer-motion";
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
      return <div className="w-3 h-3 bg-purple-500 rounded-full"></div>;
    }
    if (isRoundRevealed) {
      const vote = currentRoundState?.votes.find(
        (v) => v.id === participant.id,
      );
      if (vote) {
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white"></div>
        );
      }
      return <div className="w-3 h-3 bg-gray-600 rounded-full"></div>;
    } else if (participant.hasVoted) {
      return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
    } else {
      return (
        <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
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
    <div className="h-full p-4 lg:max-h-none max-h-64 overflow-y-auto">
      <div className="space-y-6">
        {/* Active Participants - Only those who can vote */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Active Participants (
            <span data-testid="active-participant-count">
              {votedActiveParticipants}/{activeParticipants.length}
            </span>
            )
            <span data-testid="participant-count" className="sr-only">
              {participants.length}
            </span>
          </h3>
          <div className="lg:space-y-3 lg:block flex flex-wrap gap-2">
            <AnimatePresence>
              {activeParticipants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  className="flex items-center justify-between bg-gray-800/40 border border-gray-700/40 rounded-lg p-3 lg:w-full w-auto"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  data-testid={`participant-${participant.name}`}
                >
                  <div className="flex items-center space-x-3">
                    {getParticipantIndicator(participant)}
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-medium ${
                          participant.id === account.id
                            ? "text-blue-400"
                            : "text-gray-300"
                        }`}
                        data-testid={`participant-name-${participant.name}`}
                      >
                        {participant.id === account.id
                          ? "You"
                          : participant.name}
                        {getRoleDisplay(participant) && (
                          <span className="ml-1 text-xs text-gray-400">
                            {getRoleDisplay(participant)}
                          </span>
                        )}
                      </span>
                      {!isRoundRevealed && (
                        <span className="text-xs text-gray-500">
                          {getParticipantStatus(participant)}
                        </span>
                      )}
                      {isRoundRevealed && (
                        <span className="text-xs text-gray-400">
                          Vote: {getParticipantStatus(participant)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Visitors - Separate section */}
        {visitors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Visitors (
              <span data-testid="visitor-count">{visitors.length}</span>)
            </h3>
            <div className="lg:space-y-3 lg:block flex flex-wrap gap-2">
              <AnimatePresence>
                {visitors.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    className="flex items-center justify-between bg-purple-900/20 border border-purple-700/40 rounded-lg p-3 lg:w-full w-auto"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    data-testid={`visitor-${participant.name}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getParticipantIndicator(participant)}
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${
                            participant.id === account.id
                              ? "text-purple-400"
                              : "text-gray-300"
                          }`}
                          data-testid={`visitor-name-${participant.name}`}
                        >
                          {participant.id === account.id
                            ? "You"
                            : participant.name}
                          <span className="ml-1 text-xs text-purple-500">
                            👁
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {getParticipantStatus(participant)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
