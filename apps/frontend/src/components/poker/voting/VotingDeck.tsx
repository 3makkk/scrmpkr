import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "../../../hooks/useRoom";
import { useAuth } from "../../../AuthProvider";
import { shouldShowVotingControls } from "../../../utils/ui-permissions";
import Card from "../shared/Card";
import PokerCard from "../shared/PokerCard";

const DECK: Array<number | "?"> = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, "?"];

export default function VotingDeck() {
  const { selectedCard, castVote, roomState } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isRoundRevealed = roomState.currentRoundState?.status === "revealed";

  // Check if current user can vote using the centralized ACL
  const currentUser = roomState.participants.find((p) => p.id === account.id);
  const canUserVote = currentUser?.role
    ? shouldShowVotingControls(currentUser.role)
    : false;

  // If user is a visitor, show observer message
  if (!canUserVote) {
    return (
      <Card
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-white mb-4">Observer Mode</h2>
          <p className="text-gray-400 mb-6">
            You're viewing this session as a visitor. You can observe but not
            participate in voting.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-purple-900/20 border border-purple-700/40 rounded-lg">
            <span className="text-purple-400 text-sm font-medium">
              👁 Visitor Access
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h2
        className="text-lg font-medium text-white mb-8 text-center"
        data-testid="voting-deck-title"
      >
        Choose your estimate
      </h2>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {DECK.map((value, index) => (
          <PokerCard
            key={value}
            value={value}
            isSelected={selectedCard === value}
            onValueClick={castVote}
            disabled={isRoundRevealed}
            initial={{ scale: 0.8, opacity: 0, y: 30, rotate: 10 }}
            animate={{
              scale: selectedCard === value ? 1.12 : 1,
              opacity: 1,
              y: selectedCard === value ? -12 : 0,
              rotate: selectedCard === value ? -3 : 0,
              borderColor:
                selectedCard === value ? "#3B82F6" : "rgba(75, 85, 99, 0.8)",
              boxShadow:
                selectedCard === value
                  ? "0 0 20px rgba(59, 130, 246, 0.4), 0 8px 25px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
            whileHover={
              isRoundRevealed
                ? {}
                : selectedCard === value
                  ? {
                      scale: 1.15,
                      y: -15,
                      rotate: -4,
                      transition: { duration: 0.1, ease: "easeOut" },
                    }
                  : {
                      scale: 1.05,
                      y: -4,
                      rotate: -1,
                      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
                      transition: { duration: 0.1, ease: "easeOut" },
                    }
            }
            whileTap={
              isRoundRevealed
                ? {}
                : {
                    scale: 0.97,
                    y: 1,
                    transition: { duration: 0.05, ease: "easeOut" },
                  }
            }
            transition={{
              duration: 0.2,
              ease: "easeOut",
              delay: index * 0.03,
            }}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedCard !== null && (
          <motion.div
            className="mt-8 text-center"
            data-testid="vote-confirmation"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          ></motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
