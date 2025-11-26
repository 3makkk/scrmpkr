import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "../hooks/useRoom";
import { useAuth } from "../AuthProvider";
import Card from "./Card";
import PokerCard from "./PokerCard";

const DECK: Array<number | "?"> = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, "?"];

export default function VotingDeck() {
  const { selectedCard, castVote, roomState } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  const isRoundRevealed = roomState.currentRoundState?.status === "revealed";

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
          >
            <motion.div
              className="inline-flex items-center bg-slate-500/20 border border-slate-500/30 rounded-lg px-4 py-2"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <span className="text-white">
                You voted:{" "}
                <strong data-testid="voted-value" className="text-blue-400">
                  {selectedCard}
                </strong>
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
