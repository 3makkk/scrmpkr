import { Page, BrowserContext, test, expect } from "@playwright/test";

export type Player = {
  page: Page;
  context: BrowserContext;
  name: string;
  id: string;
};

export const FIBONACCI_DECK = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "?",
];

export class ScrumPokerTestHelpers {
  static async createPlayer(browser: any, name: string): Promise<Player> {
    return await test.step(`Create player: ${name}`, async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const id = `player-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;

      return { page, context, name, id };
    });
  }

  static async loginPlayer(player: Player) {
    return await test.step(`Login player: ${player.name}`, async () => {
      await player.page.goto("/");

      // Wait for login form and enter name
      await player.page.waitForSelector('[data-testid="user-name-input"]', {
        timeout: 10000,
      });
      await player.page.fill('[data-testid="user-name-input"]', player.name);
      await player.page.click('[data-testid="login-button"]');

      // Wait for home page to load
      await player.page.waitForSelector('[data-testid="welcome-message"]', {
        timeout: 10000,
      });
    });
  }

  static async joinRoom(player: Player, roomId: string) {
    return await test.step(`${player.name} joins room: ${roomId}`, async () => {
      await player.page.goto(`/r/${roomId}`);
      await player.page.waitForSelector('[data-testid="voting-deck-title"]', {
        timeout: 10000,
      });
    });
  }

  static async createRoom(player: Player, roomName: string): Promise<string> {
    return await test.step(`${player.name} creates room: ${roomName}`, async () => {
      await player.page.goto("/");

      // Click create custom room
      await player.page.click('[data-testid="create-custom-room-button"]');

      // Enter room name using the data-testid for better reliability
      await player.page.fill('[data-testid="room-name-input"]', roomName);
      await player.page.click('[data-testid="create-room-submit-button"]');

      // Wait for room to load and extract room ID from URL
      await player.page.waitForSelector('[data-testid="voting-deck-title"]', {
        timeout: 10000,
      });
      const url = player.page.url();
      const roomId = url.split("/r/")[1];

      return roomId;
    });
  }

  static async castVote(player: Player, value: string) {
    return await test.step(`${player.name} casts vote: ${value}`, async () => {
      // Click on the poker card using the data-testid
      await player.page.click(`[data-testid="vote-card-${value}"]`);

      // Wait for the voting progress to update (indicating the vote was registered)
      await player.page.waitForFunction(
        (playerName) => {
          // Look for the participant status to show as "voted"
          const participantElement = document.querySelector(
            `[data-testid="participant-${playerName}"]`,
          );
          if (!participantElement) return false;

          // Check if the participant shows as having voted
          return (
            participantElement.textContent &&
            participantElement.textContent.includes("voted")
          );
        },
        player.name,
        { timeout: 5000 },
      );
    });
  }

  static async revealVotes(player: Player) {
    return await test.step(`${player.name} reveals votes`, async () => {
      await player.page.click('[data-testid="reveal-votes-button"]');

      // Wait for results to appear
      await player.page.waitForSelector('[data-testid="voting-results"]', {
        timeout: 5000,
      });
    });
  }

  static async clearVotes(player: Player) {
    return await test.step(`${player.name} clears votes`, async () => {
      // Try data-testid first, fallback to button text
      const clearButton = player.page
        .locator('[data-testid="clear-votes-button"]')
        .or(player.page.locator('button:has-text("Clear Votes")'));

      await clearButton.waitFor({ timeout: 10000 });
      await clearButton.click();

      // Wait for voting deck to reappear
      await player.page.waitForSelector('[data-testid="voting-deck-title"]', {
        timeout: 10000,
      });
    });
  }

  static async leaveRoom(player: Player) {
    return await test.step(`${player.name} leaves room`, async () => {
      await player.page.click('[data-testid="leave-room-button"]');
      await player.page.waitForSelector(
        '[data-testid="create-custom-room-button"]',
        {
          timeout: 5000,
        },
      );

      // Add a small delay to ensure server state is fully updated
      await player.page.waitForTimeout(500);
    });
  }

  static async waitForParticipantCount(player: Player, count: number) {
    return await test.step(`Wait for ${count} participants in room`, async () => {
      await player.page.waitForSelector(
        `[data-testid="participant-count"]:has-text("${count}")`,
        {
          timeout: 5000,
        },
      );
    });
  }

  static async waitForVotingProgress(
    player: Player,
    voted: number,
    total: number,
  ) {
    return await test.step(`Wait for voting progress: ${voted} of ${total} voted`, async () => {
      await player.page.waitForFunction(
        ([expectedVoted, expectedTotal]) => {
          const votingProgress = document.querySelector(
            '[data-testid="voting-progress"]',
          );
          if (!votingProgress || !votingProgress.textContent) return false;

          // Extract the numbers from text like "X of Y participants have voted"
          const match = votingProgress.textContent.match(
            /(\d+)\s+of\s+(\d+)\s+participants/,
          );
          if (!match) return false;

          const actualVoted = parseInt(match[1]);
          const actualTotal = parseInt(match[2]);

          return actualVoted === expectedVoted && actualTotal === expectedTotal;
        },
        [voted, total],
        { timeout: 5000 },
      );
    });
  }

  static async changeUsername(player: Player, newName: string) {
    return await test.step(`${player.name} changes username to: ${newName}`, async () => {
      // Click on the account indicator
      await player.page.click('[data-testid="account-indicator"]');

      // Wait for the context menu to appear
      await player.page.waitForSelector('[data-testid="account-menu"]', {
        timeout: 5000,
      });

      // Click on "Change username" option
      await player.page.click('[data-testid="change-username-button"]');

      // Wait for the username edit overlay
      await player.page.waitForSelector(
        '[data-testid="username-edit-overlay"]',
        {
          timeout: 5000,
        },
      );

      // Clear current name and enter new name
      await player.page.fill('[data-testid="user-name-input"]', newName);

      // Click save/change name button
      await player.page.click('[data-testid="login-button"]');

      // Wait for overlay to close
      await player.page.waitForSelector(
        '[data-testid="username-edit-overlay"]',
        {
          state: "hidden",
          timeout: 5000,
        },
      );

      // Update player name for future references
      player.name = newName;
    });
  }

  static async verifyParticipantNameVisible(
    player: Player,
    participantName: string,
  ) {
    return await test.step(`${player.name} verifies participant ${participantName} is visible`, async () => {
      await player.page.waitForSelector(
        `[data-testid="participant-${participantName}"]`,
        { timeout: 5000 },
      );
    });
  }

  static async verifyAccountIndicatorName(
    player: Player,
    expectedInitials: string,
  ) {
    return await test.step(`Verify ${player.name} account indicator shows initials: ${expectedInitials}`, async () => {
      const accountIndicator = player.page.locator(
        '[data-testid="account-indicator"]',
      );
      await expect(accountIndicator).toHaveText(expectedInitials);
    });
  }
}
