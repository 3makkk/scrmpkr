import type { RoundState, RoundStatus, RoundVote } from "@scrmpkr/shared";
import RoundStatsModel from "./roundStats.js";

type VoteParticipant = { id: string; name: string };

export default class Round {
  constructor(roundNumber: number) {
    this.roundNumber = roundNumber;
    this.status = "voting";
    this.votes = [];
  }

  private roundNumber: number;
  private status: RoundStatus;
  private votes: RoundVote[];

  addOrUpdateVote(participant: VoteParticipant, value: number | "?"): void {
    const existingIndex = this.votes.findIndex(
      (vote) => vote.id === participant.id,
    );
    const voteRecord: RoundVote = {
      id: participant.id,
      name: participant.name,
      value,
    };
    if (existingIndex >= 0) this.votes.splice(existingIndex, 1, voteRecord);
    else this.votes.push(voteRecord);
    this.status = "voting";
  }

  markRevealed(): void {
    this.status = "revealed";
  }

  updateParticipantName(userId: string, newName: string): boolean {
    const voteIndex = this.votes.findIndex((vote) => vote.id === userId);
    if (voteIndex >= 0) {
      this.votes[voteIndex].name = newName;
      return true;
    }
    return false;
  }

  clear(): void {
    this.votes = [];
    this.status = "voting";
  }

  toState(): RoundState {
    return {
      round: this.roundNumber,
      status: this.status,
      votes: [...this.votes],
      stats: RoundStatsModel.fromVotes(this.votes),
    };
  }
}
