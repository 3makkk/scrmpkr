import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";

export default function ContextualTeamStatus() {
  const { roomState, votedCount } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const { participants, currentRoundState, ownerId } = roomState;
  const isRoundRevealed = currentRoundState?.status === "revealed";
  const currentUser = participants.find((p) => p.id === account.id);

  const getParticipantStatus = (participant: any) => {
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

  const getParticipantIndicator = (participant: any) => {
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

  return (
    <div className="h-full p-4 lg:max-h-none max-h-64 overflow-y-auto">
      <div className="space-y-6">
        {/* Team Status - Vertical layout for sidebar, horizontal on mobile */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Team Status ({votedCount}/{participants.length})
          </h3>
          <div className="lg:space-y-3 lg:block flex flex-wrap gap-2">
            <AnimatePresence>
              {participants.map((participant, index) => (
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
                        {participant.id === ownerId && (
                          <span className="ml-1 text-xs text-blue-500">★</span>
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
      </div>
    </div>
  );
}
