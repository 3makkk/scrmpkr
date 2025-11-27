import { test, expect } from "@playwright/test";
import { TestActions, UserAssertions } from "./test-assertions";

test.describe("Simple Scrum Poker Test", () => {
  test("basic login and room creation", async ({ browser }) => {
    const user = await TestActions.createUser(browser, "TestUser");

    try {
      // Step 1: Login
      await TestActions.loginUser(user);
      await UserAssertions.for(user).shouldBeLoggedIn();

      // Step 2: Create room
      await TestActions.createRoom(
        user,
        `simple-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

      // Step 3: Verify we're in the room and can see voting interface
      await UserAssertions.for(user).shouldBeInRoom();
      await test.step("Verify room interface is loaded", async () => {
        await expect(
          user.page.locator("text=Choose your estimate"),
        ).toBeVisible();
      });
    } catch (error) {
      await test.step("Handle test failure", async () => {
        console.error("Test failed:", error);
        throw error;
      });
    } finally {
      await test.step("Cleanup test resources", async () => {
        await user.context.close();
      });
    }
  });
});
