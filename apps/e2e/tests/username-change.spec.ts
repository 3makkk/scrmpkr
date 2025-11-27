import { test, expect } from "@playwright/test";
import { TestActions, UserAssertions, RoomAssertions } from "./test-assertions";
import type { User, Room } from "./domain-objects";

test.describe("Username Change Functionality", () => {
  const users: User[] = [];
  let roomOwner: User;
  let room: Room;

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup users for username change test", async () => {
      // Create two users for testing username changes
      const userNames = ["Alice", "Bob"];

      for (const name of userNames) {
        const user = await TestActions.createUser(browser, name);
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
      await TestActions.loginUser(roomOwner);
      room = await TestActions.createRoom(
        roomOwner,
        `username-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

      // Second user joins
      await TestActions.loginUser(users[1]);
      await TestActions.joinRoom(users[1], room);

      // Verify both users are in the room
      await RoomAssertions.for(room).shouldHaveParticipantCount(roomOwner, 2);
      await RoomAssertions.for(room).shouldHaveParticipantCount(users[1], 2);
    });

    // Step 2: Verify initial state - both users can see each other
    await test.step("Verify initial participant visibility", async () => {
      // Alice should see Bob
      await RoomAssertions.for(room).shouldShowParticipant(roomOwner, "Bob");

      // Bob should see Alice
      await RoomAssertions.for(room).shouldShowParticipant(users[1], "Alice");

      // Verify account indicators show correct initials
      await UserAssertions.for(roomOwner).shouldHaveAccountInitials("A");
      await UserAssertions.for(users[1]).shouldHaveAccountInitials("B");
    });

    // Step 3: Alice changes her username
    await test.step("Alice changes username to 'Alice Smith'", async () => {
      await TestActions.changeUsername(roomOwner, "Alice Smith");

      // Verify Alice's account indicator updates
      await UserAssertions.for(roomOwner).shouldHaveAccountInitials("AS");
    });

    // Step 4: Verify Bob sees Alice's new name
    await test.step("Verify Bob sees Alice's updated name", async () => {
      // Wait a moment for the socket update to propagate
      await users[1].page.waitForTimeout(1000);

      // Bob should now see "Alice Smith" in the participant list
      await RoomAssertions.for(room).shouldShowParticipant(
        users[1],
        "Alice Smith",
      );

      // The old name should no longer be visible
      await expect(
        users[1].page.locator('[data-testid="participant-Alice"]'),
      ).not.toBeVisible();
    });

    // Step 5: Bob changes his username
    await test.step("Bob changes username to 'Robert Johnson'", async () => {
      await TestActions.changeUsername(users[1], "Robert Johnson");

      // Verify Bob's account indicator updates
      await UserAssertions.for(users[1]).shouldHaveAccountInitials("RJ");
    });

    // Step 6: Verify Alice sees Bob's new name
    await test.step("Verify Alice sees Bob's updated name", async () => {
      // Wait a moment for the socket update to propagate
      await roomOwner.page.waitForTimeout(1000);

      // Alice should now see "Robert Johnson" in the participant list
      await RoomAssertions.for(room).shouldShowParticipant(
        roomOwner,
        "Robert Johnson",
      );

      // The old name should no longer be visible
      await expect(
        roomOwner.page.locator('[data-testid="participant-Bob"]'),
      ).not.toBeVisible();
    });

    // Step 7: Verify basic room functionality still works
    await test.step("Verify room functionality still works after username changes", async () => {
      // Both users should still see the correct participant count
      await RoomAssertions.for(room).shouldHaveParticipantCount(roomOwner, 2);
      await RoomAssertions.for(room).shouldHaveParticipantCount(users[1], 2);

      // Room functionality is working if participants can see each other
      // This verifies the core functionality without checking specific voting UI
    });
  });

  test("username change workflow cancellation", async ({ browser }) => {
    // Step 1: Create a single user test
    await test.step("Setup single user for cancellation test", async () => {
      const testUser = await TestActions.createUser(browser, "TestUser");
      users.push(testUser);

      await TestActions.loginUser(testUser);
      await TestActions.createRoom(
        testUser,
        `cancel-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

      // Step 2: Test cancellation workflow
      await test.step("Test username change cancellation", async () => {
        const originalName = testUser.name;

        // Click on account indicator
        await testUser.openAccountMenu();

        // Click on change username
        await testUser.clickChangeUsername();

        // Enter a new name but cancel by pressing escape or clicking outside
        await testUser.page.fill(
          '[data-testid="user-name-input"]',
          "Canceled Name",
        );

        // Click cancel button if it exists
        const cancelButton = testUser.page.locator(
          '[data-testid="username-cancel"]',
        );
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        } else {
          // If no cancel button, press escape
          await testUser.page.keyboard.press("Escape");
        }

        // Verify overlay is closed
        await testUser.page.waitForSelector(
          '[data-testid="username-edit-overlay"]',
          {
            state: "hidden",
          },
        );

        // Verify original name is still shown in account indicator
        await UserAssertions.for(testUser).shouldHaveAccountInitials("T");

        // Verify participant list still shows original name
        await expect(
          testUser.page.locator(`[data-testid="participant-${originalName}"]`),
        ).toBeVisible();
      });

      // Cleanup
      await testUser.context.close();
    });
  });

  test("username change with special characters and edge cases", async ({
    browser,
  }) => {
    await test.step("Test username change edge cases", async () => {
      const testUser = await TestActions.createUser(browser, "EdgeCaseUser");
      users.push(testUser);

      await TestActions.loginUser(testUser);
      const testRoom = await TestActions.createRoom(
        testUser,
        `edge-case-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

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
          await TestActions.changeUsername(testUser, testCase.name);

          // Wait for update to propagate
          await testUser.page.waitForTimeout(500);

          await UserAssertions.for(testUser).shouldHaveAccountInitials(
            testCase.expectedInitials,
          );

          // Verify participant name is updated
          await RoomAssertions.for(testRoom).shouldShowParticipant(
            testUser,
            testCase.name,
          );
        });
      }

      // Cleanup
      await testUser.context.close();
    });
  });
});
