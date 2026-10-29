import { expect, test } from "@playwright/test";
import type { TestParticipation } from "./domain-objects/TestParticipation";
import { TestRoom } from "./domain-objects/TestRoom";
import { TestUser } from "./domain-objects/TestUser";

test.describe("Room layout on phones", () => {
  const users: TestUser[] = [];
  let facilitator: TestUser;
  let voter: TestUser;

  test.beforeAll(async ({ browser }) => {
    for (const name of ["Facil", "Voter"]) {
      users.push(await TestUser.create(browser, name));
    }
    [facilitator, voter] = users;
    await voter.page.setViewportSize({ width: 390, height: 844 });
  });

  test.afterAll(async () => {
    for (const user of users) {
      await user.context.close();
    }
  });

  test("floating reveal button does not cover the last poker card", async () => {
    let voterParticipation: TestParticipation;

    await test.step("Facilitator creates a room, a participant joins on a phone", async () => {
      await facilitator.navigateToHome();
      await facilitator.fillLoginForm();
      const room = await TestRoom.createByUser(
        facilitator,
        `layout-test-room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      );
      await room.addUser(facilitator, "FACILITATOR");

      await voter.navigateToHome();
      await voter.fillLoginForm();
      voterParticipation = await room.addUser(voter, "PARTICIPANT");
    });

    await test.step("Participant votes, so the floating button appears", async () => {
      await voterParticipation.castVote("5");
      await expect(
        voter.page.locator('[data-testid="reveal-votes-button"]'),
      ).toBeVisible();
    });

    await test.step("The last card is still clickable at the bottom of the page", async () => {
      const lastCard = voter.page.locator('[data-testid="vote-card-?"]');
      const revealButton = voter.page.locator(
        '[data-testid="reveal-votes-button"]',
      );
      await voter.page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );

      const card = await lastCard.boundingBox();
      const button = await revealButton.boundingBox();
      expect(card).not.toBeNull();
      expect(button).not.toBeNull();
      if (!card || !button) return;
      const overlaps =
        card.x < button.x + button.width &&
        button.x < card.x + card.width &&
        card.y < button.y + button.height &&
        button.y < card.y + card.height;
      expect(overlaps, "floating button overlaps the last card").toBe(false);

      await lastCard.click({ timeout: 5_000 });
      await expect(lastCard).toHaveAttribute("aria-pressed", "true");
    });
  });
});
