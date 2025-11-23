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
    <Card>
      <h2
        className="text-lg font-medium text-white mb-8 text-center"
        data-testid="voting-deck-title"
      >
        Choose your estimate
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {DECK.map((value) => (
          <PokerCard
            key={value}
            value={value}
            isSelected={selectedCard === value}
            onClick={castVote}
            disabled={isRoundRevealed}
          />
        ))}
      </div>

      {selectedCard !== null && (
        <div className="mt-8 text-center" data-testid="vote-confirmation">
          <div className="inline-flex items-center bg-slate-500/20 border border-slate-500/30 rounded-lg px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-white">
              You voted:{" "}
              <strong data-testid="voted-value">{selectedCard}</strong>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
