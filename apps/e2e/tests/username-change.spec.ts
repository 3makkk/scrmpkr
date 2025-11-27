import { test, expect } from "@playwright/test";
import { ScrumPokerTestHelpers, type Player } from "./helpers";

test.describe("Username Change Functionality", () => {
  let players: Player[] = [];
  let roomOwner: Player;
  let roomId: string;

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup players for username change test", async () => {
      // Create two players for testing username changes
      const playerNames = ["Alice", "Bob"];

      for (const name of playerNames) {
        const player = await ScrumPokerTestHelpers.createPlayer(browser, name);
        players.push(player);
      }

      roomOwner = players[0]; // Alice is the room owner
    });
  });

  test.afterAll(async () => {
    await test.step("Cleanup all player sessions", async () => {
      // Clean up all player sessions
      for (const player of players) {
        await player.context.close();
      }
    });
  });

  test("user can change username and other participants see the change", async ({
    browser,
  }) => {
    // Step 1: Room owner creates a room and second player joins
    await test.step("Setup room with two participants", async () => {
      await ScrumPokerTestHelpers.loginPlayer(roomOwner);
      roomId = await ScrumPokerTestHelpers.createRoom(
        roomOwner,
        `username-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

      // Second player joins
      await ScrumPokerTestHelpers.loginPlayer(players[1]);
      await ScrumPokerTestHelpers.joinRoom(players[1], roomId);

      // Verify both players are in the room
      await ScrumPokerTestHelpers.waitForParticipantCount(roomOwner, 2);
      await ScrumPokerTestHelpers.waitForParticipantCount(players[1], 2);
    });

    // Step 2: Verify initial state - both players can see each other
    await test.step("Verify initial participant visibility", async () => {
      // Alice should see Bob
      await ScrumPokerTestHelpers.verifyParticipantNameVisible(
        roomOwner,
        "Bob",
      );

      // Bob should see Alice
      await ScrumPokerTestHelpers.verifyParticipantNameVisible(
        players[1],
        "Alice",
      );

      // Verify account indicators show correct initials
      await ScrumPokerTestHelpers.verifyAccountIndicatorName(roomOwner, "A");
      await ScrumPokerTestHelpers.verifyAccountIndicatorName(players[1], "B");
    });

    // Step 3: Alice changes her username
    await test.step("Alice changes username to 'Alice Smith'", async () => {
      await ScrumPokerTestHelpers.changeUsername(roomOwner, "Alice Smith");

      // Verify Alice's account indicator updates
      await ScrumPokerTestHelpers.verifyAccountIndicatorName(roomOwner, "AS");
    });

    // Step 4: Verify Bob sees Alice's new name
    await test.step("Verify Bob sees Alice's updated name", async () => {
      // Wait a moment for the socket update to propagate
      await players[1].page.waitForTimeout(1000);

      // Bob should now see "Alice Smith" in the participant list
      await ScrumPokerTestHelpers.verifyParticipantNameVisible(
        players[1],
        "Alice Smith",
      );

      // The old name should no longer be visible
      await expect(
        players[1].page.locator('[data-testid="participant-Alice"]'),
      ).not.toBeVisible();
    });

    // Step 5: Bob changes his username
    await test.step("Bob changes username to 'Robert Johnson'", async () => {
      await ScrumPokerTestHelpers.changeUsername(players[1], "Robert Johnson");

      // Verify Bob's account indicator updates
      await ScrumPokerTestHelpers.verifyAccountIndicatorName(players[1], "RJ");
    });

    // Step 6: Verify Alice sees Bob's new name
    await test.step("Verify Alice sees Bob's updated name", async () => {
      // Wait a moment for the socket update to propagate
      await roomOwner.page.waitForTimeout(1000);

      // Alice should now see "Robert Johnson" in the participant list
      await ScrumPokerTestHelpers.verifyParticipantNameVisible(
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
      // Both players should still see the correct participant count
      await ScrumPokerTestHelpers.waitForParticipantCount(roomOwner, 2);
      await ScrumPokerTestHelpers.waitForParticipantCount(players[1], 2);

      // Verify the voting deck is still accessible
      await expect(
        roomOwner.page.locator('[data-testid="voting-deck-title"]'),
      ).toBeVisible();
      await expect(
        players[1].page.locator('[data-testid="voting-deck-title"]'),
      ).toBeVisible();
    });
  });

  test("username change workflow cancellation", async ({ browser }) => {
    // Step 1: Create a single player test
    await test.step("Setup single player for cancellation test", async () => {
      const testPlayer = await ScrumPokerTestHelpers.createPlayer(
        browser,
        "TestUser",
      );
      players.push(testPlayer);

      await ScrumPokerTestHelpers.loginPlayer(testPlayer);
      const testRoomId = await ScrumPokerTestHelpers.createRoom(
        testPlayer,
        `cancel-test-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );

      // Step 2: Test cancellation workflow
      await test.step("Test username change cancellation", async () => {
        const originalName = testPlayer.name;

        // Click on account indicator
        await testPlayer.page.click('[data-testid="account-indicator"]');

        // Click on change username
        await testPlayer.page.click('[data-testid="change-username-button"]');

        // Wait for overlay
        await testPlayer.page.waitForSelector(
          '[data-testid="username-edit-overlay"]',
        );

        // Enter a new name but cancel
        await testPlayer.page.fill(
          '[data-testid="user-name-input"]',
          "Canceled Name",
        );

        // Click cancel button
        await testPlayer.page.click('[data-testid="username-cancel"]');

        // Verify overlay is closed
        await testPlayer.page.waitForSelector(
          '[data-testid="username-edit-overlay"]',
          {
            state: "hidden",
            timeout: 5000,
          },
        );

        // Verify original name is still shown in account indicator
        await ScrumPokerTestHelpers.verifyAccountIndicatorName(testPlayer, "T");

        // Verify participant list still shows original name
        await expect(
          testPlayer.page.locator(
            `[data-testid="participant-${originalName}"]`,
          ),
        ).toBeVisible();
      });

      // Cleanup
      await testPlayer.context.close();
    });
  });

  test("username change with special characters and edge cases", async ({
    browser,
  }) => {
    await test.step("Test username change edge cases", async () => {
      const testPlayer = await ScrumPokerTestHelpers.createPlayer(
        browser,
        "EdgeCaseUser",
      );
      players.push(testPlayer);

      await ScrumPokerTestHelpers.loginPlayer(testPlayer);
      await ScrumPokerTestHelpers.createRoom(
        testPlayer,
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
          await ScrumPokerTestHelpers.changeUsername(testPlayer, testCase.name);

          // Wait for update to propagate
          await testPlayer.page.waitForTimeout(500);

          await ScrumPokerTestHelpers.verifyAccountIndicatorName(
            testPlayer,
            testCase.expectedInitials,
          );

          // Verify participant name is updated
          await ScrumPokerTestHelpers.verifyParticipantNameVisible(
            testPlayer,
            testCase.name,
          );
        });
      }

      // Cleanup
      await testPlayer.context.close();
    });
  });
});
