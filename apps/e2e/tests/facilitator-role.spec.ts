import { test, expect } from "@playwright/test";
import { UserAssertions, RoomAssertions } from "./test-assertions";
import type { TestParticipation } from "./domain-objects/TestParticipation";
import { TestUser } from "./domain-objects/TestUser";
import { TestRoom } from "./domain-objects/TestRoom";

test.describe("Facilitator Role Functionality", () => {
  const users: TestUser[] = [];
  let facilitator: TestUser;
  let voter: TestUser;
  let room: TestRoom;
  let voterParticipation: TestParticipation;

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup users for facilitator role test", async () => {
      for (const name of ["Facil", "Voter"]) {
        users.push(await TestUser.create(browser, name));
      }
      [facilitator, voter] = users;
    });
  });

  test.afterAll(async () => {
    await test.step("Cleanup all user sessions", async () => {
      for (const user of users) {
        await user.context.close();
      }
    });
  });

  test("facilitator manages the session without voting", async () => {
    await test.step("Facilitator creates a room and joins as facilitator", async () => {
      await facilitator.navigateToHome();
      await facilitator.fillLoginForm();
      room = await TestRoom.createByUser(
        facilitator,
        `facilitator-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );
      await room.addUser(facilitator, "FACILITATOR");
    });

    await test.step("Facilitator does not see the voting deck", async () => {
      await UserAssertions.for(facilitator).shouldNotSeeVotingDeck();
      await expect(
        facilitator.page.locator('[data-testid="voting-deck-title"]'),
      ).not.toBeVisible();
    });

    await test.step("Participant joins and is shown separately from the facilitator", async () => {
      await voter.navigateToHome();
      await voter.fillLoginForm();
      voterParticipation = await room.addUser(voter, "PARTICIPANT");

      await RoomAssertions.for(room).shouldHaveFacilitatorCount(facilitator, 1);
      await UserAssertions.for(voter).shouldSeeVotingDeck();
    });

    await test.step("Facilitator can reveal after the participant votes", async () => {
      await voterParticipation.castVote("5");

      // Facilitator has session control and sees the reveal button.
      await facilitator.page.waitForSelector(
        '[data-testid="reveal-votes-button"]',
        {},
      );
      await facilitator.clickRevealVotes();

      await RoomAssertions.for(room).shouldShowVotingResults(facilitator);
      await expect(
        facilitator.page.locator('[data-testid="clear-votes-button"]'),
      ).toBeVisible();
    });

    await test.step("Facilitator can start the next round", async () => {
      await facilitator.clickClearVotes();
      await RoomAssertions.for(room).shouldHaveFacilitatorCount(facilitator, 1);
    });
  });
});
