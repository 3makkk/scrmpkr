import { test, expect } from "@playwright/test";
import { TestUser } from "./domain-objects/TestUser";
import { TestRoom } from "./domain-objects/TestRoom";

test.describe("Username Change Functionality", () => {
  const users: TestUser[] = [];
  let roomOwner: TestUser;
  let room: TestRoom;

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup users for username change test", async () => {
      // Create two users for testing username changes
      const userNames = ["Alice", "Bob"];

      for (const name of userNames) {
        const user = await TestUser.create(browser, name);
        users.push(user);
      }

      roomOwner = users[0]; // Alice is the room owner
    });
  });

  test.afterAll(async () => {
    await test.step("Cleanup all user sessions", async () => {
      // Clean up all user sessions
      for (const user of users) {
        await user.context.close();
      }
    });
  });

  test("user can change username and other participants see the change", async () => {
    // Step 1: Room owner creates a room and second user joins
    await test.step("Setup room with two participants", async () => {
      await roomOwner.navigateToHome();
      await roomOwner.fillLoginForm();

      const roomName = `username-test-room-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      room = await TestRoom.createByUser(roomOwner, roomName);

      await room.addUser(roomOwner, "PARTICIPANT");

      // Second user joins
      await users[1].navigateToHome();
      await users[1].fillLoginForm();
      await room.addUser(users[1], "PARTICIPANT");

      // Verify both users are in the room
      await expect(room.getParticipantCountElement(users[1])).toHaveText("2");
      await expect(room.getParticipantCountElement(roomOwner)).toHaveText("2");
    });

    // Step 2: Verify initial state - both users can see each other
    await test.step("Verify initial participant visibility", async () => {
      // Alice should see Bob
      await roomOwner.page.waitForSelector(`[data-testid="participant-Bob"]`);

      // Bob should see Alice
      await users[1].page.waitForSelector(`[data-testid="participant-Alice"]`);

      // Verify account indicators show correct initials
      const roomOwnerAccountIndicator = roomOwner.getAccountIndicator();
      await expect(roomOwnerAccountIndicator).toHaveText("A");
      const user1AccountIndicator = users[1].getAccountIndicator();
      await expect(user1AccountIndicator).toHaveText("B");
    });

    // Step 3: Alice changes her username
    await test.step("Alice changes username to 'Alice Smith'", async () => {
      await roomOwner.openAccountMenu();
      await roomOwner.clickChangeUsername();
      await roomOwner.fillNewUsername("Alice Smith");

      // Verify Alice's account indicator updates
      const accountIndicator = roomOwner.getAccountIndicator();
      await expect(accountIndicator).toHaveText("AS");
    });

    // Step 4: Verify Bob sees Alice's new name
    await test.step("Verify Bob sees Alice's updated name", async () => {
      // Wait a moment for the socket update to propagate
      await users[1].page.waitForTimeout(1000);

      // Bob should now see "Alice Smith" in the participant list
      await users[1].page.waitForSelector(
        `[data-testid="participant-Alice Smith"]`,
      );

      // The old name should no longer be visible
      await expect(
        users[1].page.locator('[data-testid="participant-Alice"]'),
      ).not.toBeVisible();
    });

    // Step 5: Bob changes his username
    await test.step("Bob changes username to 'Robert Johnson'", async () => {
      await users[1].openAccountMenu();
      await users[1].clickChangeUsername();
      await users[1].fillNewUsername("Robert Johnson");

      // Verify Bob's account indicator updates
      const accountIndicator = users[1].getAccountIndicator();
      await expect(accountIndicator).toHaveText("RJ");
    });

    // Step 6: Verify Alice sees Bob's new name
    await test.step("Verify Alice sees Bob's updated name", async () => {
      // Wait a moment for the socket update to propagate
      await roomOwner.page.waitForTimeout(1000);

      // Alice should now see "Robert Johnson" in the participant list
      await roomOwner.page.waitForSelector(
        `[data-testid="participant-Robert Johnson"]`,
      );

      // The old name should no longer be visible
      await expect(
        roomOwner.page.locator('[data-testid="participant-Bob"]'),
      ).not.toBeVisible();
    });

    // Step 7: Verify basic room functionality still works
    await test.step("Verify room functionality still works after username changes", async () => {
      // Both users should still see the correct participant count
      await expect(room.getParticipantCountElement(users[1])).toHaveText("2");
      await expect(room.getParticipantCountElement(roomOwner)).toHaveText("2");

      // Room functionality is working if participants can see each other
      // This verifies the core functionality without checking specific voting UI
    });
  });

  test("username change with special characters and edge cases", async ({
    browser,
  }) => {
    await test.step("Test username change edge cases", async () => {
      const testUser = await TestUser.create(browser, "EdgeCaseUser");
      users.push(testUser);

      await testUser.navigateToHome();
      await testUser.fillLoginForm();

      const roomName = `edge-case-room-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const testRoom = await TestRoom.createByUser(testUser, roomName);

      await testRoom.addUser(testUser, "PARTICIPANT");

      // Test different username formats
      const testCases = [
        { name: "John O'Connor", expectedInitials: "JO" },
        { name: "Mary-Jane Watson", expectedInitials: "MW" },
        { name: "X", expectedInitials: "X" }, // Single character
        {
          name: "Very Long Username That Exceeds Normal Length",
          expectedInitials: "VL",
        },
      ];

      for (const testCase of testCases) {
        await test.step(`Test username: ${testCase.name}`, async () => {
          await testUser.openAccountMenu();
          await testUser.clickChangeUsername();
          await testUser.fillNewUsername(testCase.name);

          // Wait for update to propagate
          await testUser.page.waitForTimeout(500);

          const accountIndicator = testUser.getAccountIndicator();
          await expect(accountIndicator).toHaveText(testCase.expectedInitials);

          // Verify participant name is updated
          await testUser.page.waitForSelector(
            `[data-testid="participant-${testCase.name}"]`,
          );
        });
      }

      // Cleanup
      await testUser.context.close();
    });
  });
});
