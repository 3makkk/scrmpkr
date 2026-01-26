import { test, expect } from "@playwright/test";
import type { TestUser } from "./domain-objects/TestUser";
import type { TestRoom } from "./domain-objects/TestRoom";

/**
 * Test-specific assertions and expectations for User interactions
 */
export class UserAssertions {
  constructor(private user: TestUser) {}

  static for(user: TestUser): UserAssertions {
    return new UserAssertions(user);
  }

  async shouldBeLoggedIn() {
    await test.step(`Verify ${this.user.name} is logged in`, async () => {
      await this.user.page.waitForSelector(
        '[data-testid="welcome-message"]',
        {},
      );
    });
  }

  async shouldHaveAccountInitials(expectedInitials: string) {
    await test.step(`Verify ${this.user.name} account indicator shows initials: ${expectedInitials}`, async () => {
      const accountIndicator = this.user.getAccountIndicator();
      await expect(accountIndicator).toHaveText(expectedInitials);
    });
  }

  async shouldSeeUsernameEditOverlayClosed() {
    await test.step(`Verify username edit overlay is closed for ${this.user.name}`, async () => {
      await this.user.page.waitForSelector(
        '[data-testid="username-edit-overlay"]',
        {
          state: "hidden",
        },
      );
    });
  }

  async shouldBeOnHomePage() {
    await test.step(`Verify ${this.user.name} is on home page`, async () => {
      await this.user.page.waitForSelector(
        '[data-testid="create-custom-room-button"]',
        {},
      );
    });
  }

  async shouldBeInRoom() {
    await test.step(`Verify ${this.user.name} is in a room`, async () => {
      await this.user.page.waitForSelector(
        '[data-testid="leave-room-button"]',
        {},
      );
    });
  }

  async shouldSeeRoleSelectionForm() {
    await test.step(`Verify ${this.user.name} sees role selection form`, async () => {
      await this.user.page.waitForSelector(
        '[data-testid="role-selection-join-button"]',
        {},
      );
    });
  }

  async shouldSeeVotingDeck() {
    await test.step(`Verify ${this.user.name} can see voting deck`, async () => {
      await this.user.page.waitForSelector(
        '[data-testid="voting-deck-title"]',
        {},
      );
    });
  }

  async shouldNotSeeVotingDeck() {
    await test.step(`Verify ${this.user.name} cannot see voting deck (visitor mode)`, async () => {
      await this.user.page.waitForTimeout(1000);
      const _votingDeck = this.user.getVotingDeck();
    });
  }
}

/**
 * Test-specific assertions and expectations for Room interactions
 */
export class RoomAssertions {
  static for(_room: TestRoom): RoomAssertions {
    return new RoomAssertions();
  }

  async shouldHaveParticipantCount(observer: TestUser, expectedCount: number) {
    await test.step(`Wait for ${expectedCount} total participants in room`, async () => {
      await observer.page.waitForSelector(
        `[data-testid="participant-count"]:has-text("${expectedCount}")`,
        {},
      );
    });
  }

  async shouldHaveActiveParticipantCount(
    observer: TestUser,
    expectedCount: number,
  ) {
    await test.step(`Wait for ${expectedCount} active participants in room`, async () => {
      await observer.page.waitForSelector(
        `[data-testid="active-participant-count"]:has-text("${expectedCount}")`,
        {},
      );
    });
  }

  async shouldHaveVisitorCount(observer: TestUser, expectedCount: number) {
    await test.step(`Wait for ${expectedCount} visitors in room`, async () => {
      await observer.page.waitForSelector(
        `[data-testid="visitor-count"]:has-text("${expectedCount}")`,
        {},
      );
    });
  }

  async shouldShowParticipant(observer: TestUser, participantName: string) {
    await test.step(`${observer.name} verifies participant ${participantName} is visible`, async () => {
      await observer.page.waitForSelector(
        `[data-testid="participant-${participantName}"]`,
      );
    });
  }

  async shouldShowVotingResults(observer: TestUser) {
    await test.step(`Verify voting results are visible`, async () => {
      await observer.page.waitForSelector('[data-testid="voting-results"]', {});
    });
  }

  async shouldShowVotingDeckAfterClear(observer: TestUser) {
    await test.step(`Verify voting deck reappears after clearing votes`, async () => {
      await observer.page.waitForSelector(
        '[data-testid="voting-deck-title"]',
        {},
      );
    });
  }
}

/**
 * Test-specific assertions and expectations for Voting interactions
 */
export class VotingAssertions {
  static forRoom(room: TestRoom): VotingAssertions {
    return new VotingAssertions(room);
  }

  async shouldShowVotingProgress(
    observer: TestUser,
    voted: number,
    total: number,
  ) {
    await test.step(`Wait for voting progress: ${voted} of ${total} voted`, async () => {
      await observer.page.waitForFunction(
        ([expectedVoted, expectedTotal]) => {
          const votingProgress = document.querySelector(
            '[data-testid="voting-progress"]',
          );
          if (!votingProgress || !votingProgress.textContent) return false;

          // Extract numbers from text like "2 participants still voting..."
          // or check for "All participants have voted"
          if (
            expectedVoted === expectedTotal &&
            votingProgress.textContent.includes("All participants have voted")
          ) {
            return true;
          }

          // Look for pattern like "2 participants still voting..."
          const match = votingProgress.textContent.match(
            /(\d+)\s+participants\s+still\s+voting/,
          );
          if (!match) return false;

          const stillVoting = parseInt(match[1], 10);
          const actualVoted = expectedTotal - stillVoting;

          return actualVoted === expectedVoted;
        },
        [voted, total],
      );
    });
  }

  async shouldShowParticipantHasVoted(
    observer: TestUser,
    participantName: string,
  ) {
    await test.step(`Verify ${participantName} shows as having voted`, async () => {
      await observer.page.waitForFunction((playerName) => {
        const participantElement = document.querySelector(
          `[data-testid="participant-${playerName}"]`,
        );
        if (!participantElement) return false;
        return participantElement.textContent?.includes("voted");
      }, participantName);
    });
  }
}
