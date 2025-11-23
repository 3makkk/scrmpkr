import { Page, BrowserContext, test } from "@playwright/test";

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

      // Wait for vote confirmation using data-testid
      await player.page.waitForSelector('[data-testid="vote-confirmation"]', {
        timeout: 5000,
      });

      // Verify the voted value
      await player.page.waitForSelector(
        `[data-testid="voted-value"]:has-text("${value}")`,
        {
          timeout: 5000,
        },
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
      await player.page.waitForSelector(
        `[data-testid="voting-progress"]:has-text("${voted} of ${total} participants voted")`,
        { timeout: 5000 },
      );
    });
  }
}
