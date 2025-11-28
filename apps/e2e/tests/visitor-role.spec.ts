import { test, expect } from "@playwright/test";
import {
  createUser,
  loginUser,
  createRoom,
  joinRoom,
  castVote,
  revealVotes,
  UserAssertions,
  RoomAssertions,
} from "./test-assertions";
import { type User, type Room, Participation } from "./domain-objects";

test.describe("Visitor Role Functionality", () => {
  const users: User[] = [];
  let roomOwner: User;
  let participant: User;
  let visitor: User;
  let room: Room;
  let ownerParticipation: Participation;
  let participantParticipation: Participation;

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup users for visitor role test", async () => {
      const userNames = ["Alice", "Bob", "Charlie"];

      for (const name of userNames) {
        const user = await createUser(browser, name);
        users.push(user);
      }

      [roomOwner, participant, visitor] = users;
    });
  });

  test.afterAll(async () => {
    await test.step("Cleanup all user sessions", async () => {
      for (const user of users) {
        await user.context.close();
      }
    });
  });

  test("visitor can join room but cannot vote, owners and participants can reveal/clear votes", async () => {
    // Step 1: Room owner creates a room (becomes OWNER role automatically)
    await test.step("Room owner creates a room", async () => {
      await loginUser(roomOwner);
      room = await createRoom(
        roomOwner,
        `visitor-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );
      ownerParticipation = new Participation(roomOwner, room, "OWNER");
    });

    // Step 2: Participant joins as normal participant
    await test.step("Participant joins as normal participant", async () => {
      await loginUser(participant);
      participantParticipation = await joinRoom(
        participant,
        room,
        "PARTICIPANT",
      );

      // Verify we have 2 total participants
      await RoomAssertions.for(room).shouldHaveParticipantCount(roomOwner, 2);
    });

    // Step 3: Visitor joins as visitor role
    await test.step("Visitor joins as visitor role", async () => {
      await loginUser(visitor);
      await joinRoom(visitor, room, "VISITOR");

      // Now we should have 3 total participants (2 active + 1 visitor)
      await RoomAssertions.for(room).shouldHaveParticipantCount(roomOwner, 3);

      // And 1 visitor
      await RoomAssertions.for(room).shouldHaveVisitorCount(roomOwner, 1);
    });

    // Step 4: Verify visitor cannot vote
    await test.step("Verify visitor cannot vote", async () => {
      await UserAssertions.for(visitor).shouldNotSeeVotingDeck();
    });

    // Step 5: Owner and participant can vote
    await test.step("Owner and participant can vote", async () => {
      await UserAssertions.for(roomOwner).shouldSeeVotingDeck();
      await UserAssertions.for(participant).shouldSeeVotingDeck();

      // Cast votes
      await castVote(ownerParticipation, "5");
      await castVote(participantParticipation, "8");

      // Simply wait for reveal button to become available (indicating all have voted)
      await roomOwner.page.waitForSelector(
        '[data-testid="reveal-votes-button"]',
        {},
      );
    });

    // Step 6: Verify owners and participants can reveal votes, but visitors cannot
    await test.step("Owners and participants can reveal votes", async () => {
      // Owner should see reveal button
      await expect(
        roomOwner.page.locator('[data-testid="reveal-votes-button"]'),
      ).toBeVisible();

      // Participant should also see reveal button (participants can now control sessions)
      await expect(
        participant.page.locator('[data-testid="reveal-votes-button"]'),
      ).toBeVisible();

      // Visitor should NOT see reveal button
      await expect(
        visitor.page.locator('[data-testid="reveal-votes-button"]'),
      ).not.toBeVisible();
    });

    // Step 7: Owner reveals votes
    await test.step("Owner reveals votes", async () => {
      await revealVotes(ownerParticipation);

      // All users should see voting results
      await RoomAssertions.for(room).shouldShowVotingResults(roomOwner);
      await RoomAssertions.for(room).shouldShowVotingResults(participant);
      await RoomAssertions.for(room).shouldShowVotingResults(visitor);
    });

    // Step 8: Verify owners and participants can clear votes, but visitors cannot
    await test.step("Owners and participants can clear votes", async () => {
      // Owner should see clear button
      await expect(
        roomOwner.page.locator('[data-testid="clear-votes-button"]'),
      ).toBeVisible();

      // Participant should also see clear button (participants can now control sessions)
      await expect(
        participant.page.locator('[data-testid="clear-votes-button"]'),
      ).toBeVisible();

      // Visitor should NOT see clear button
      await expect(
        visitor.page.locator('[data-testid="clear-votes-button"]'),
      ).not.toBeVisible();
    });

    // Step 9: Verify visitor is shown separately in team status
    await test.step("Verify visitor is shown separately in team status", async () => {
      // Should see visitor in visitors section
      await expect(
        roomOwner.page.locator(`[data-testid="visitor-${visitor.name}"]`),
      ).toBeVisible();

      // Should see active participants (owner and participant)
      await expect(
        roomOwner.page.locator(`[data-testid="participant-${roomOwner.name}"]`),
      ).toBeVisible();
      await expect(
        roomOwner.page.locator(
          `[data-testid="participant-${participant.name}"]`,
        ),
      ).toBeVisible();
    });
  });
});
