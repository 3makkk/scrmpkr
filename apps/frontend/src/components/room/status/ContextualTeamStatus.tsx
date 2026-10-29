import { canVote, type Participant, UserRole } from "@scrmpkr/shared";
import { useAuth } from "../../../AuthProvider";
import { useRoom } from "../../../hooks/useRoom";
import ParticipantRow, { type RowStatus } from "./ParticipantRow";

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

  const getStatus = (participant: Participant): RowStatus => {
    if (isRoundRevealed) {
      const vote = currentRoundState?.votes.find(
        (v) => v.id === participant.id,
      );
      return { kind: "revealed", value: vote ? String(vote.value) : null };
    }
    return participant.hasVoted ? { kind: "voted" } : { kind: "thinking" };
  };

  const renderRows = (
    group: Participant[],
    testIdPrefix: string,
    statusFor: (participant: Participant) => RowStatus,
  ) => (
    <div className="flex flex-wrap gap-2 lg:block lg:space-y-1">
      {group.map((participant, index) => {
        const isYou = participant.id === account.id;
        return (
          <ParticipantRow
            key={participant.id}
            name={participant.name}
            displayName={isYou ? "You" : participant.name}
            role={participant.role}
            isYou={isYou}
            status={statusFor(participant)}
            nameTestId={`${testIdPrefix}-name-${participant.name}`}
            className="animate-slide-in-left lg:w-full"
            style={{ animationDelay: `${index * 50}ms` }}
            data-testid={`${testIdPrefix}-${participant.name}`}
          />
        );
      })}
    </div>
  );

  const headingClass =
    "text-xs font-medium tracking-wider text-fg-muted uppercase";

  return (
    <div className="h-full max-h-64 overflow-y-auto p-4 lg:max-h-none">
      <div className="space-y-6">
        {/* Active Participants - Only those who can vote */}
        <div className="space-y-2">
          <h3 className={headingClass}>
            Active Participants (
            <span data-testid="active-participant-count">
              {votedActiveParticipants}/{activeParticipants.length}
            </span>
            )
            <span data-testid="participant-count" className="sr-only">
              {participants.length}
            </span>
          </h3>
          {renderRows(activeParticipants, "participant", getStatus)}
        </div>

        {/* Facilitators - non-voting session managers */}
        {facilitators.length > 0 && (
          <div className="space-y-2">
            <h3 className={headingClass}>
              Facilitators (
              <span data-testid="facilitator-count">{facilitators.length}</span>
              )
            </h3>
            {renderRows(facilitators, "facilitator", () => ({
              kind: "managing",
            }))}
          </div>
        )}

        {/* Visitors - Separate section */}
        {visitors.length > 0 && (
          <div className="space-y-2">
            <h3 className={headingClass}>
              Visitors (
              <span data-testid="visitor-count">{visitors.length}</span>)
            </h3>
            {renderRows(visitors, "visitor", () => ({ kind: "observing" }))}
          </div>
        )}
      </div>
    </div>
  );
}
