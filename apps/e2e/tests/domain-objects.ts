import type { Page, BrowserContext, Browser } from "@playwright/test";

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

/**
 * Represents a user interacting with the application
 * Contains only actions, no expectations or assertions
 */
export class User {
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

  static async create(browser: Browser, name: string): Promise<User> {
    const context = await browser.newContext();
    const page = await context.newPage();
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return new User(page, context, name, id);
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
    return url.split("/r/")[1];
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

/**
 * Represents a poker room entity
 * Contains only actions related to room management, no expectations
 */
export class Room {
  public readonly id: string;
  public readonly name: string;
  public readonly creator: User;

  constructor(id: string, name: string, creator: User) {
    this.id = id;
    this.name = name;
    this.creator = creator;
  }

  static async createByUser(user: User, roomName: string): Promise<Room> {
    await user.navigateToHome();
    await user.clickCreateCustomRoom();
    await user.fillRoomName(roomName);

    // Wait for the room to be fully created and user to be in it
    await user.page.waitForSelector('[data-testid="leave-room-button"]', {});

    const roomId = await user.getCurrentRoomId();
    return new Room(roomId, roomName, user);
  }

  async addUser(user: User, role: "PARTICIPANT" | "VISITOR" = "PARTICIPANT") {
    await user.navigateToRoom(this.id);
    await user.selectRole(role);

    // Wait for the user to be fully added to the room
    await user.page.waitForSelector('[data-testid="leave-room-button"]', {});
  }

  getParticipantCountElement(observer: User) {
    return observer.page.locator('[data-testid="participant-count"]');
  }

  getActiveParticipantCountElement(observer: User) {
    return observer.page.locator('[data-testid="active-participant-count"]');
  }

  getVisitorCountElement(observer: User) {
    return observer.page.locator('[data-testid="visitor-count"]');
  }

  getParticipantElement(observer: User, participantName: string) {
    return observer.page.locator(
      `[data-testid="participant-${participantName}"]`,
    );
  }

  getVotingProgressElement(observer: User) {
    return observer.page.locator('[data-testid="voting-progress"]');
  }

  getVotingResultsElement(observer: User) {
    return observer.page.locator('[data-testid="voting-results"]');
  }
}

/**
 * Represents a user's participation in a specific room
 * Contains only actions related to participation, no expectations
 */
export class Participation {
  public readonly user: User;
  public readonly room: Room;
  public readonly role: "PARTICIPANT" | "VISITOR" | "OWNER";

  constructor(
    user: User,
    room: Room,
    role: "PARTICIPANT" | "VISITOR" | "OWNER",
  ) {
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
    return this.role === "PARTICIPANT" || this.role === "OWNER";
  }
}
