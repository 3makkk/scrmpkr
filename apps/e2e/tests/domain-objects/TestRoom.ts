import { TestParticipation } from "./TestParticipation";
import type { TestUser } from "./TestUser";

/**
 * Represents a poker room entity
 * Contains only actions related to room management, no expectations
 */

export class TestRoom {
  public readonly id: string;
  public readonly name: string;
  public readonly creator: TestUser;

  constructor(id: string, name: string, creator: TestUser) {
    this.id = id;
    this.name = name;
    this.creator = creator;
  }

  static async createByUser(
    user: TestUser,
    roomName: string,
  ): Promise<TestRoom> {
    await user.navigateToHome();
    await user.clickCreateCustomRoom();
    await user.fillRoomName(roomName);

    // Wait for navigation to the room page
    await user.page.waitForURL(/\/r\/.+/, { timeout: 10000 });

    const roomId = await user.getCurrentRoomId();
    if (!roomId) {
      throw new Error(
        `Failed to get room ID after creating room "${roomName}". Current URL: ${user.page.url()}`,
      );
    }
    return new TestRoom(roomId, roomName, user);
  }

  async addUser(
    user: TestUser,
    role: "PARTICIPANT" | "VISITOR" = "PARTICIPANT",
  ): Promise<TestParticipation> {
    await user.navigateToRoom(this.id);
    await user.selectRole(role);

    // Wait for the user to be fully added to the room
    await user.page.waitForSelector('[data-testid="leave-room-button"]', {});

    return new TestParticipation(user, this, role);
  }

  getParticipantCountElement(observer: TestUser) {
    return observer.page.locator('[data-testid="participant-count"]');
  }

  getActiveParticipantCountElement(observer: TestUser) {
    return observer.page.locator('[data-testid="active-participant-count"]');
  }

  getVisitorCountElement(observer: TestUser) {
    return observer.page.locator('[data-testid="visitor-count"]');
  }

  getParticipantElement(observer: TestUser, participantName: string) {
    return observer.page.locator(
      `[data-testid="participant-${participantName}"]`,
    );
  }

  getVotingProgressElement(observer: TestUser) {
    return observer.page.locator('[data-testid="voting-progress"]');
  }

  getVotingResultsElement(observer: TestUser) {
    return observer.page.locator('[data-testid="voting-results"]');
  }
}
