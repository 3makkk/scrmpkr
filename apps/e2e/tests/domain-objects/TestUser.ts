import type { Page, BrowserContext, Browser } from "@playwright/test";

export type Player = {
  page: Page;
  context: BrowserContext;
  name: string;
  id: string;
};

/**
 * Represents a user interacting with the application
 * Contains only actions, no expectations or assertions
 */

export class TestUser {
  public page: Page;
  public context: BrowserContext;
  public name: string;
  public readonly id: string;

  constructor(page: Page, context: BrowserContext, name: string, id: string) {
    this.page = page;
    this.context = context;
    this.name = name;
    this.id = id;
  }

  static async create(browser: Browser, name: string): Promise<TestUser> {
    const context = await browser.newContext();
    const page = await context.newPage();
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return new TestUser(page, context, name, id);
  }

  async navigateToHome() {
    await this.page.goto("/");
  }

  async fillLoginForm() {
    await this.page.waitForSelector('[data-testid="user-name-input"]', {});
    await this.page.fill('[data-testid="user-name-input"]', this.name);
    await this.page.click('[data-testid="login-button"]');
  }

  async openAccountMenu() {
    await this.page.click('[data-testid="account-indicator"]');
    await this.page.waitForSelector('[data-testid="account-menu"]', {});
  }

  async clickChangeUsername() {
    await this.page.click('[data-testid="change-username-button"]');
    await this.page.waitForSelector(
      '[data-testid="username-edit-overlay"]',
      {},
    );
  }

  async fillNewUsername(newName: string) {
    await this.page.fill('[data-testid="user-name-input"]', newName);
    await this.page.click('[data-testid="login-button"]');
    this.name = newName;
  }

  async clickCreateCustomRoom() {
    await this.page.click('[data-testid="create-custom-room-button"]');
  }

  async fillRoomName(roomName: string) {
    await this.page.fill('[data-testid="room-name-input"]', roomName);
    await this.page.click('[data-testid="create-room-submit-button"]');
  }

  async navigateToRoom(roomId: string) {
    await this.page.goto(`/r/${roomId}`);
  }

  async selectRole(role: "PARTICIPANT" | "VISITOR") {
    // Wait for role selection form to appear first
    await this.page.waitForSelector(
      '[data-testid="role-selection-join-button"]',
      {},
    );

    if (role === "VISITOR") {
      await this.page.click('[data-testid="role-visitor-option"]');
    } else {
      await this.page.click('[data-testid="role-participant-option"]');
    }
    await this.page.click('[data-testid="role-selection-join-button"]');
  }

  async clickLeaveRoom() {
    await this.page.click('[data-testid="leave-room-button"]');
  }

  async clickVoteCard(value: string) {
    const votingCard = this.page.locator(`[data-testid="vote-card-${value}"]`);
    await votingCard.waitFor({});
    await votingCard.click();
  }

  async clickRevealVotes() {
    await this.page.click('[data-testid="reveal-votes-button"]');
  }

  async clickClearVotes() {
    const clearButton = this.page
      .locator('[data-testid="clear-votes-button"]')
      .or(this.page.locator('button:has-text("Clear Votes")'));
    await clearButton.waitFor({ timeout: 10000 });
    await clearButton.click();
  }

  getAccountIndicator() {
    return this.page.locator('[data-testid="account-indicator"]');
  }

  getVotingDeck() {
    return this.page.locator('[data-testid="voting-deck-title"]');
  }

  async getCurrentRoomId(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/r\/([^/?#]+)/);
    if (!match || !match[1]) {
      throw new Error(`Cannot extract room ID from URL: ${url}`);
    }
    return match[1];
  }

  toPlayer(): Player {
    return {
      page: this.page,
      context: this.context,
      name: this.name,
      id: this.id,
    };
  }
}
