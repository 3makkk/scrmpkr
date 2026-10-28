import type { RoomState, RoundState } from "@scrmpkr/shared";
import {
  canControlSession,
  canPerformAction,
  canVote,
  type PermissionContext,
  type UserRole,
  type ValidPermission,
} from "@scrmpkr/shared";
import Round from "./round.js";

export type Participant = {
  id: string;
  name: string;
  role: UserRole;
};

export type User = {
  id: string;
  name: string;
};

export default class Room {
  constructor(id: string, participant: Participant) {
    this.id = id;
    this.creatorId = participant.id;
    this.name = id;
    this.participants = new Map();
    this.status = "voting";
    this.currentRound = 1;
    this.currentRoundTracker = new Round(this.currentRound);

    this.participants.set(participant.id, participant);
  }

  readonly id: string;
  readonly creatorId: string;
  readonly name: string;
  readonly participants: Map<string, Participant>;
  status: "voting";
  currentRound: number;
  private currentRoundTracker: Round;

  addParticipant(user: User, role: UserRole = "participant"): void {
    this.participants.set(user.id, { id: user.id, name: user.name, role });
    // A vote cast before leaving survives in the round tracker; keep its name
    // in sync when the voter rejoins under a new name.
    this.currentRoundTracker.updateParticipantName(user.id, user.name);
  }

  removeParticipant(userId: string): boolean {
    const wasPresent = this.participants.has(userId);
    this.participants.delete(userId);
    return wasPresent;
  }

  updateParticipantName(userId: string, newName: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    participant.name = newName;
    this.currentRoundTracker.updateParticipantName(userId, newName);
    return true;
  }

  updateParticipantRole(userId: string, newRole: UserRole): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    // Only the role changes. The round tracker is left untouched: a vote
    // already cast survives in the current round exactly as it does when a
    // voter leaves.
    participant.role = newRole;
    return true;
  }

  recordVote(userId: string, value: number | "?"): Participant | undefined {
    const participant = this.participants.get(userId);
    if (!participant) return undefined;
    this.currentRoundTracker.addOrUpdateVote(
      { id: participant.id, name: participant.name },
      value,
    );
    return participant;
  }

  resetForNewRound(): void {
    this.currentRound += 1;
    this.currentRoundTracker = new Round(this.currentRound);
  }

  revealCurrentRound(): number | undefined {
    this.currentRoundTracker.markRevealed();
    const numericValues = this.currentRoundTracker
      .getVotes()
      .filter((vote) => typeof vote.value === "number")
      .map((vote) => vote.value as number);
    const unique = [...new Set(numericValues)];
    return unique.length === 1 && numericValues.length > 0
      ? unique[0]
      : undefined;
  }

  hasAnyVotes(): boolean {
    return this.currentRoundTracker.getVotes().length > 0;
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
      creatorId: this.creatorId,
      participants: Array.from(this.participants.values()).map(
        (participant) => ({
          id: participant.id,
          name: participant.name,
          hasVoted: this.currentRoundTracker.hasVoted(participant.id),
          role: participant.role,
        }),
      ),
      status: this.status,
      currentRound: this.currentRound,
      currentRoundState: this.getCurrentRoundState(),
    };
  }

  // ACL methods using the centralized permission system
  canVote(userId: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;
    return canVote(participant.role);
  }

  canRevealVotes(userId: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    const context: PermissionContext = {
      userRole: participant.role,
      userId,
      hasVotes: this.hasAnyVotes(),
    };

    return canPerformAction("round:reveal", context);
  }

  canClearVotes(userId: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    const context: PermissionContext = {
      userRole: participant.role,
      userId,
      hasVotes: this.hasAnyVotes(),
    };

    return canPerformAction("round:clear", context);
  }

  canControlSession(userId: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;
    return canControlSession(participant.role);
  }

  getUserRole(userId: string): UserRole | null {
    const participant = this.participants.get(userId);
    return participant?.role || null;
  }

  // Check if user can perform any action (generic permission check)
  hasPermission(userId: string, permission: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    const context: PermissionContext = {
      userRole: participant.role,
      userId,
    };

    return canPerformAction(permission as ValidPermission, context);
  }
}
