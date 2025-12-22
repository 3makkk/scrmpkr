import { test, expect } from "@playwright/test";
import { RoomAssertions, VotingAssertions } from "./test-assertions";
import type { TestParticipation } from "./domain-objects/TestParticipation";
import { TestUser } from "./domain-objects/TestUser";
import { TestRoom } from "./domain-objects/TestRoom";

test.describe("Scrum Poker Game Simulation", () => {
  const users: TestUser[] = [];
  let roomOwner: TestUser;
  let room: TestRoom;
  const participations: TestParticipation[] = [];

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup initial users", async () => {
      // Create initial 5 users
      const userNames = ["Alice", "Bob", "Charlie", "Diana", "Eve"];

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

  test("complete scrum poker game with players joining and leaving", async ({
    browser,
  }) => {
    // Step 1: Room owner creates a room
    await test.step("Room creation phase", async () => {
      await roomOwner.navigateToHome();
      await roomOwner.fillLoginForm();
      room = await TestRoom.createByUser(
        roomOwner,
        `test-room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      );

      const participation = await room.addUser(roomOwner, "PARTICIPANT");
      participations.push(participation);
    });

    // Define a stable user for room controls (since ownership is removed)
    const remainingUser = users[0]; // Alice (will stay throughout the test)

    // Step 2: Initial 4 users (excluding owner) join the room
    await test.step("Initial user joining phase", async () => {
      for (let i = 1; i < 5; i++) {
        await users[i].navigateToHome();
        await users[i].fillLoginForm();
        const participation = await room.addUser(users[i], "PARTICIPANT");
        participations.push(participation);

        // Verify user appears in participant list on all pages
        for (let j = 0; j <= i; j++) {
          await expect(
            users[j].page.locator(
              `[data-testid="participant-${users[i].name}"]`,
            ),
          ).toBeVisible();
        }
      }
    });

    // Verify all 5 users are in the room
    await test.step("Verify initial participant count", async () => {
      await RoomAssertions.for(room).shouldHaveParticipantCount(
        remainingUser,
        5,
      );
    });

    // Step 3: First round of voting - all 5 users vote
    await test.step("First voting round", async () => {
      const round1Votes = ["1", "2", "3", "5", "8"];
      for (let i = 0; i < 5; i++) {
        await participations[i].castVote(round1Votes[i]);
      }

      // Wait for reveal button to appear (indicating all have voted)
      await remainingUser.page.waitForSelector(
        '[data-testid="reveal-votes-button"]',
        {},
      );
    });

    // Step 4: Any user reveals votes
    await test.step("First round reveal", async () => {
      await participations[0].revealVotes();

      // Verify results visible to all active users
      for (const user of users.slice(0, 5)) {
        await RoomAssertions.for(room).shouldShowVotingResults(user);
        await expect(
          user.page.locator('[data-testid="vote-average"]'),
        ).toBeVisible();
      }
    });

    // Step 5: One user (Eve) leaves between rounds
    await test.step("User leaves between rounds", async () => {
      const leavingParticipation = participations[4]; // Eve
      await leavingParticipation.leave();
      // Add a small delay to ensure server state is fully updated
      await leavingParticipation.user.page.waitForTimeout(500);
    });

    // Step 6: Any remaining user starts new round by clearing votes
    await test.step("Start second round", async () => {
      await participations[0].clearVotes();

      // Verify participant count updated (now 4 users)
      await RoomAssertions.for(room).shouldHaveParticipantCount(
        remainingUser,
        4,
      );
    });

    // Step 7: Two new users join mid-game
    const activeParticipations = participations.slice(0, 4); // First 4 participations

    await test.step("New users join mid-game", async () => {
      const newUser1 = await TestUser.create(browser, "Frank");
      const newUser2 = await TestUser.create(browser, "Grace");

      await newUser1.navigateToHome();
      await newUser1.fillLoginForm();
      const participation1 = await room.addUser(newUser1, "PARTICIPANT");

      await newUser2.navigateToHome();
      await newUser2.fillLoginForm();
      const participation2 = await room.addUser(newUser2, "PARTICIPANT");

      // Verify participant count updated (now 6 users)
      await RoomAssertions.for(room).shouldHaveParticipantCount(
        remainingUser,
        6,
      );

      activeParticipations.push(participation1, participation2);
      users.push(newUser1, newUser2);
    });

    // Step 8: Second round of voting with current active users
    await test.step("Second voting round with new users", async () => {
      const round2Votes = ["2", "3", "5", "8", "1", "2"];
      for (let i = 0; i < activeParticipations.length; i++) {
        await activeParticipations[i].castVote(round2Votes[i]);
      }

      // Verify all current users voted
      await VotingAssertions.forRoom(room).shouldShowVotingProgress(
        remainingUser,
        6,
        6,
      );
    });

    // Step 9: Reveal second round
    await test.step("Second round reveal", async () => {
      await activeParticipations[0].revealVotes();

      // Verify results visible to all active users
      for (const participation of activeParticipations) {
        await RoomAssertions.for(room).shouldShowVotingResults(
          participation.user,
        );
        await expect(
          participation.user.page.locator('[data-testid="vote-average"]'),
        ).toBeVisible();
      }
    });

    // Step 10: One more user leaves (Bob)
    await test.step("Another user leaves", async () => {
      await activeParticipations[1].leave(); // Bob's participation
      // Add a small delay to ensure server state is fully updated
      await activeParticipations[1].user.page.waitForTimeout(500);
    });

    // Step 11: Start third round
    await test.step("Start third round", async () => {
      await activeParticipations[0].clearVotes();

      // Verify participant count updated (now 5 users)
      await RoomAssertions.for(room).shouldHaveParticipantCount(
        remainingUser,
        5,
      );
    });

    // Step 12: Final round of voting with remaining users
    await test.step("Final voting round", async () => {
      const finalActiveParticipations = [
        activeParticipations[0], // Alice
        activeParticipations[2], // Charlie
        activeParticipations[3], // Diana
        activeParticipations[4], // Frank
        activeParticipations[5], // Grace
      ];
      const round3Votes = ["5", "5", "8", "5", "5"];

      for (let i = 0; i < finalActiveParticipations.length; i++) {
        await finalActiveParticipations[i].castVote(round3Votes[i]);
      }
    });

    // Step 13: Reveal final round
    await test.step("Final round reveal and verify consensus", async () => {
      const finalActiveParticipations = [
        activeParticipations[0], // Alice
        activeParticipations[2], // Charlie
        activeParticipations[3], // Diana
        activeParticipations[4], // Frank
        activeParticipations[5], // Grace
      ];

      await finalActiveParticipations[0].revealVotes();

      // Verify consensus achieved (most votes are 5)
      for (const participation of finalActiveParticipations) {
        await RoomAssertions.for(room).shouldShowVotingResults(
          participation.user,
        );
        // The test should show consensus with value 5 (4 out of 5 voted for 5)
        await expect(
          participation.user.page.locator('[data-testid="vote-most-common"]'),
        ).toContainText("5");
      }
    });

    // Clean up new user sessions
    await test.step("Cleanup new user sessions", async () => {
      await users[4].context.close();
      await users[5].context.close();
    });
  });

  test("verify room functionality edge cases", async ({ browser }) => {
    const testUser = await TestUser.create(browser, "TestUser");
    await testUser.navigateToHome();
    await testUser.fillLoginForm();
    const testRoom = await TestRoom.createByUser(
      testUser,
      `edge-case-room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );
    const testParticipation = await testRoom.addUser(testUser, "PARTICIPANT");

    await test.step("Test question mark vote", async () => {
      // Cast a question mark vote
      await testParticipation.castVote("?");

      // Verify the participant shows as having voted
      await expect(
        testUser.page.locator(`[data-testid="participant-${testUser.name}"]`),
      ).toContainText("voted");
    });

    await test.step("Reveal question mark vote", async () => {
      // Reveal votes with just one user
      await testParticipation.revealVotes();
      await RoomAssertions.for(testRoom).shouldShowVotingResults(testUser);
    });

    await test.step("Test zero vote", async () => {
      // Clear and test with zero vote
      await testParticipation.clearVotes();
      await testParticipation.castVote("0");
      await testParticipation.revealVotes();
    });

    await test.step("Cleanup edge case test", async () => {
      // Clean up
      await testUser.context.close();
    });
  });
});
