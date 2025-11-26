import { test, expect } from "@playwright/test";
import { ScrumPokerTestHelpers } from "./helpers";

test.describe("Simple Scrum Poker Test", () => {
  test("basic login and room creation", async ({ browser }) => {
    let player: any;

    await test.step("Setup test player", async () => {
      player = await ScrumPokerTestHelpers.createPlayer(browser, "TestUser");
    });

    try {
      // Step 1: Login
      await ScrumPokerTestHelpers.loginPlayer(player);

      // Step 2: Create room
      const roomId = await ScrumPokerTestHelpers.createRoom(
        player,
        `simple-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

      // Step 3: Verify we're in the room
      await test.step("Verify room interface is loaded", async () => {
        await expect(
          player.page.locator("text=Choose your estimate"),
        ).toBeVisible();
      });
    } catch (error) {
      await test.step("Handle test failure", async () => {
        console.error("Test failed:", error);
        throw error;
      });
    } finally {
      await test.step("Cleanup test resources", async () => {
        await player.context.close();
      });
    }
  });
});
