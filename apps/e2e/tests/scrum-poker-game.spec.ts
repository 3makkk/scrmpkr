import { test, expect, Page, BrowserContext } from "@playwright/test";
import { ScrumPokerTestHelpers, type Player, FIBONACCI_DECK } from "./helpers";

test.describe("Scrum Poker Game Simulation", () => {
  let players: Player[] = [];
  let roomOwner: Player;
  let roomId: string;

  test.beforeAll(async ({ browser }) => {
    await test.step("Setup initial players", async () => {
      // Create initial 5 players
      const playerNames = ["Alice", "Bob", "Charlie", "Diana", "Eve"];

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

  test("complete scrum poker game with players joining and leaving", async ({
    browser,
  }) => {
    // Step 1: Room owner creates a room
    await test.step("Room creation phase", async () => {
      await ScrumPokerTestHelpers.loginPlayer(roomOwner);
      roomId = await ScrumPokerTestHelpers.createRoom(
        roomOwner,
        `test-room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      );
    });

    // Define a stable player for room controls (since ownership is removed)
    const remainingPlayer = players[0]; // Alice (will stay throughout the test)

    // Step 2: Initial 4 players (excluding owner) join the room
    await test.step("Initial player joining phase", async () => {
      for (let i = 1; i < 5; i++) {
        await ScrumPokerTestHelpers.loginPlayer(players[i]);
        await ScrumPokerTestHelpers.joinRoom(players[i], roomId);

        // Verify player appears in participant list on all pages
        for (let j = 0; j <= i; j++) {
          await expect(
            players[j].page.locator(
              `[data-testid="participant-${players[i].name}"]`,
            ),
          ).toBeVisible();
        }
      }
    });

    // Verify all 5 players are in the room
    await test.step("Verify initial participant count", async () => {
      await ScrumPokerTestHelpers.waitForParticipantCount(remainingPlayer, 5);
    });

    // Step 3: First round of voting - all 5 players vote
    await test.step("First voting round", async () => {
      const round1Votes = ["1", "2", "3", "5", "8"];
      for (let i = 0; i < 5; i++) {
        await ScrumPokerTestHelpers.castVote(players[i], round1Votes[i]);
      }

      // Verify voting progress
      await ScrumPokerTestHelpers.waitForVotingProgress(remainingPlayer, 5, 5);
    });

    // Step 4: Any player reveals votes
    await test.step("First round reveal", async () => {
      await ScrumPokerTestHelpers.revealVotes(remainingPlayer);

      // Verify results visible to all active players
      for (const player of players.slice(0, 5)) {
        await expect(
          player.page.locator('[data-testid="voting-results"]'),
        ).toBeVisible();
        await expect(
          player.page.locator('[data-testid="vote-average"]'),
        ).toBeVisible();
      }
    });

    // Step 5: One player (Eve) leaves between rounds
    await test.step("Player leaves between rounds", async () => {
      const leavingPlayer = players[4]; // Eve
      await ScrumPokerTestHelpers.leaveRoom(leavingPlayer);
    });

    // Step 6: Any remaining player starts new round by clearing votes
    await test.step("Start second round", async () => {
      await ScrumPokerTestHelpers.clearVotes(remainingPlayer);

      // Verify participant count updated (now 4 players)
      await ScrumPokerTestHelpers.waitForParticipantCount(remainingPlayer, 4);
    });

    // Step 7: Two new players join mid-game
    let newPlayer1: any, newPlayer2: any;
    await test.step("New players join mid-game", async () => {
      newPlayer1 = await ScrumPokerTestHelpers.createPlayer(browser, "Frank");
      newPlayer2 = await ScrumPokerTestHelpers.createPlayer(browser, "Grace");

      await ScrumPokerTestHelpers.loginPlayer(newPlayer1);
      await ScrumPokerTestHelpers.joinRoom(newPlayer1, roomId);

      await ScrumPokerTestHelpers.loginPlayer(newPlayer2);
      await ScrumPokerTestHelpers.joinRoom(newPlayer2, roomId);

      // Verify participant count updated (now 6 players)
      await ScrumPokerTestHelpers.waitForParticipantCount(remainingPlayer, 6);
    });

    // Update players array for active players
    const activePlayers = [
      players[0],
      players[1],
      players[2],
      players[3],
      newPlayer1,
      newPlayer2,
    ];

    // Step 8: Second round of voting with current active players
    await test.step("Second voting round with new players", async () => {
      const round2Votes = ["2", "3", "5", "8", "1", "2"];
      for (let i = 0; i < activePlayers.length; i++) {
        await ScrumPokerTestHelpers.castVote(activePlayers[i], round2Votes[i]);
      }

      // Verify all current players voted
      await ScrumPokerTestHelpers.waitForVotingProgress(remainingPlayer, 6, 6);
    });

    // Step 9: Reveal second round
    await test.step("Second round reveal", async () => {
      await ScrumPokerTestHelpers.revealVotes(remainingPlayer);

      // Verify results visible to all active players
      for (const player of activePlayers) {
        await expect(
          player.page.locator('[data-testid="voting-results"]'),
        ).toBeVisible();
        await expect(
          player.page.locator('[data-testid="vote-average"]'),
        ).toBeVisible();
      }
    });

    // Step 10: One more player leaves (Bob)
    await test.step("Another player leaves", async () => {
      await ScrumPokerTestHelpers.leaveRoom(players[1]);
    });

    // Step 11: Start third round
    await test.step("Start third round", async () => {
      await ScrumPokerTestHelpers.clearVotes(remainingPlayer);

      // Verify participant count updated (now 5 players)
      await ScrumPokerTestHelpers.waitForParticipantCount(remainingPlayer, 5);
    });

    // Step 12: Final round of voting with remaining players
    await test.step("Final voting round", async () => {
      const finalActivePlayers = [
        players[0],
        players[2],
        players[3],
        newPlayer1,
        newPlayer2,
      ];
      const round3Votes = ["5", "5", "8", "5", "5"];

      for (let i = 0; i < finalActivePlayers.length; i++) {
        await ScrumPokerTestHelpers.castVote(
          finalActivePlayers[i],
          round3Votes[i],
        );
      }
    });

    // Step 13: Reveal final round
    await test.step("Final round reveal and verify consensus", async () => {
      const finalActivePlayers = [
        players[0],
        players[2],
        players[3],
        newPlayer1,
        newPlayer2,
      ];

      await ScrumPokerTestHelpers.revealVotes(remainingPlayer);

      // Verify consensus achieved (most votes are 5)
      for (const player of finalActivePlayers) {
        await expect(
          player.page.locator('[data-testid="voting-results"]'),
        ).toBeVisible();
        // The test should show consensus with value 5 (4 out of 5 voted for 5)
        await expect(
          player.page.locator('[data-testid="vote-most-common"]'),
        ).toContainText("5");
      }
    });

    // Clean up new player sessions
    await test.step("Cleanup new player sessions", async () => {
      await newPlayer1.context.close();
      await newPlayer2.context.close();
    });
  });

  test("verify room functionality edge cases", async ({ browser }) => {
    let testPlayer: any;
    let testRoomId: string;

    // Test with question mark votes and mixed voting patterns
    await test.step("Setup edge case test environment", async () => {
      testPlayer = await ScrumPokerTestHelpers.createPlayer(
        browser,
        "TestPlayer",
      );
      await ScrumPokerTestHelpers.loginPlayer(testPlayer);

      testRoomId = await ScrumPokerTestHelpers.createRoom(
        testPlayer,
        `edge-case-room-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`,
      );
    });

    await test.step("Test question mark vote", async () => {
      // Cast a question mark vote
      await ScrumPokerTestHelpers.castVote(testPlayer, "?");
      await expect(
        testPlayer.page.locator('[data-testid="vote-confirmation"]'),
      ).toBeVisible();
      await expect(
        testPlayer.page.locator('[data-testid="voted-value"]'),
      ).toContainText("?");
    });

    await test.step("Reveal question mark vote", async () => {
      // Reveal votes with just one player
      await ScrumPokerTestHelpers.revealVotes(testPlayer);
      await expect(
        testPlayer.page.locator('[data-testid="voting-results"]'),
      ).toBeVisible();
    });

    await test.step("Test zero vote", async () => {
      // Clear and test with zero vote
      await ScrumPokerTestHelpers.clearVotes(testPlayer);
      await ScrumPokerTestHelpers.castVote(testPlayer, "0");
      await ScrumPokerTestHelpers.revealVotes(testPlayer);
    });

    await test.step("Cleanup edge case test", async () => {
      // Clean up
      await testPlayer.context.close();
    });
  });
});
