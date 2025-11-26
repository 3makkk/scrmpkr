import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import Badge from "./ds/Badge/Badge";

export default function ParticipantList() {
  const { roomState } = useRoom();

  if (!roomState) return null;

  const { participants, ownerId } = roomState;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
        Participants
        <Badge
          bgClass="bg-blue-600"
          rounded="full"
          className="ml-3 text-sm font-medium"
          data-testid="participant-count"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2, ease: "easeOut" }}
        >
          {participants.length}
        </Badge>
      </h2>
      <div className="space-y-3">
        <AnimatePresence>
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{
                duration: 0.2,
                delay: index * 0.02,
              }}
              className="flex items-center justify-between bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors"
              data-testid={`participant-${participant.name}`}
            >
              <div className="flex items-center space-x-3">
                <motion.span
                  className="text-white font-medium"
                  data-testid={`participant-name-${participant.name}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {participant.name}
                </motion.span>
                {participant.id === ownerId && (
                  <Badge
                    bgClass="bg-blue-900"
                    rounded="full"
                    className="text-xs font-semibold px-2 py-1"
                    data-testid={`participant-owner-${participant.name}`}
                    transition={{ delay: index * 0.1 + 0.4 }}
                  >
                    OWNER
                  </Badge>
                )}
              </div>
              <motion.div
                className="text-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: index * 0.05 + 0.2,
                  duration: 0.2,
                  ease: "easeOut",
                }}
              >
                {participant.hasVoted ? (
                  <motion.div
                    className="w-3 h-3 bg-green-500 rounded-full shadow-lg"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0.4)",
                        "0 0 0 4px rgba(34, 197, 94, 0)",
                        "0 0 0 0 rgba(34, 197, 94, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ) : (
                  <div className="w-3 h-3 bg-gray-600 rounded-full" />
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
