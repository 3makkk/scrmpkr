import { useAuth } from "../../../AuthProvider";
import { useRoom } from "../../../hooks/useRoom";
import { shouldShowVotingControls } from "../../../utils/ui-permissions";
import PokerCard from "../shared/PokerCard";

const DECK: Array<number | "?"> = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, "?"];

export default function VotingDeck() {
  const { selectedCard, castVote, roomState } = useRoom();
  const { account } = useAuth();

  if (!roomState || !account) return null;

  console.log("Rendering Home page", roomState);

  const isRoundRevealed = roomState.currentRoundState?.status === "revealed";

  // Check if current user can vote using the centralized ACL
  const currentUser = roomState.participants.find((p) => p.id === account.id);
  const canUserVote = currentUser?.role
    ? shouldShowVotingControls(currentUser.role)
    : false;

  // If user is a visitor, show observer message
  if (!canUserVote) {
    return (
      <div className="animate-fade-in-scale p-6">
        <div className="py-12 text-center">
          <h2 className="mb-4 text-lg font-medium text-white">Observer Mode</h2>
          <p className="text-gray-400">
            You're viewing this session as a visitor. You can observe but not
            participate in voting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-scale p-6">
      <h2
        className="mb-8 text-center text-lg font-medium text-white"
        data-testid="voting-deck-title"
      >
        Choose your estimate
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {DECK.map((value, index) => (
          <div
            key={value}
            className={`animate-fade-in-scale`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PokerCard
              value={value}
              isSelected={selectedCard === value}
              onValueClick={castVote}
              disabled={isRoundRevealed}
            />
          </div>
        ))}
      </div>

      {selectedCard !== null && (
        <div
          className="animate-fade-in-scale mt-8 text-center"
          data-testid="vote-confirmation"
        ></div>
      )}
    </div>
  );
}
