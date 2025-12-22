import type { TestRoom } from "./TestRoom";
import type { TestUser } from "./TestUser";

/**
 * Represents a user's participation in a specific room
 * Contains only actions related to participation, no expectations
 */

export class TestParticipation {
  public readonly user: TestUser;
  public readonly room: TestRoom;
  public readonly role: "PARTICIPANT" | "VISITOR";

  constructor(user: TestUser, room: TestRoom, role: "PARTICIPANT" | "VISITOR") {
    this.user = user;
    this.room = room;
    this.role = role;
  }

  async leave() {
    await this.user.clickLeaveRoom();
  }

  async castVote(value: string) {
    await this.user.clickVoteCard(value);
  }

  async revealVotes() {
    await this.user.clickRevealVotes();
  }

  async clearVotes() {
    await this.user.clickClearVotes();
  }

  canVote(): boolean {
    return this.role === "PARTICIPANT";
  }
}
