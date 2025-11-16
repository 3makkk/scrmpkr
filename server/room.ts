import Round from "./round";
import type { RoomState, RoundState } from "@scrmpkr/shared";

export type Participant = {
  id: string;
  name: string;
  hasVoted: boolean;
  value?: number | "?";
};

export type User = {
  id: string;
  name: string;
};

export default class Room {
  constructor(id: string, ownerId: string, ownerName: string) {
    this.id = id;
    this.ownerId = ownerId;
    this.name = id;
    this.participants = new Map();
    this.status = "voting";
    this.currentRound = 1;
    this.currentRoundTracker = new Round(this.currentRound);

    this.participants.set(ownerId, {
      id: ownerId,
      name: ownerName,
      hasVoted: false,
    });
  }

  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly participants: Map<string, Participant>;
  status: "voting";
  currentRound: number;
  private currentRoundTracker: Round;

  addParticipant(user: User): void {
    this.participants.set(user.id, {
      id: user.id,
      name: user.name,
      hasVoted: false,
    });
  }

  removeParticipant(userId: string): boolean {
    const wasPresent = this.participants.has(userId);
    this.participants.delete(userId);
    return wasPresent;
  }

  recordVote(userId: string, value: number | "?"): Participant | undefined {
    const participant = this.participants.get(userId);
    if (!participant) return undefined;
    participant.hasVoted = true;
    participant.value = value;
    this.currentRoundTracker.addOrUpdateVote(
      { id: participant.id, name: participant.name },
      value,
    );
    return participant;
  }

  resetForNewRound(): void {
    this.currentRound += 1;
    this.currentRoundTracker = new Round(this.currentRound);
    for (const participant of this.participants.values()) {
      participant.hasVoted = false;
      delete participant.value;
    }
  }

  revealCurrentRound(): number | undefined {
    this.currentRoundTracker.markRevealed();
    const numericValues = this.currentRoundTracker
      .toState()
      .votes.filter((vote) => typeof vote.value === "number")
      .map((vote) => vote.value as number);
    const unique = [...new Set(numericValues)];
    return unique.length === 1 && numericValues.length > 0
      ? unique[0]
      : undefined;
  }

  hasAnyVotes(): boolean {
    return (
      this.currentRoundTracker.toState().votes.length > 0 ||
      Array.from(this.participants.values()).some(
        (participant) => participant.hasVoted,
      )
    );
  }

  getCurrentRoundState(): RoundState {
    return this.currentRoundTracker.toState();
  }

  getHistory(): RoundState[] {
    return [];
  }

  toState(): RoomState {
    return {
      id: this.id,
      ownerId: this.ownerId,
      participants: Array.from(this.participants.values()).map(
        (participant) => ({
          id: participant.id,
          name: participant.name,
          hasVoted: participant.hasVoted,
        }),
      ),
      status: this.status,
      currentRound: this.currentRound,
      currentRoundState: this.getCurrentRoundState(),
    };
  }
}
