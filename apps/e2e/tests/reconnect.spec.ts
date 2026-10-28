import { expect, test } from "@playwright/test";
import type { TestParticipation } from "./domain-objects/TestParticipation";
import { TestRoom } from "./domain-objects/TestRoom";
import { TestUser } from "./domain-objects/TestUser";
import { RoomAssertions, VotingAssertions } from "./test-assertions";

test.describe("Reconnect", () => {
  let owner: TestUser;
  let player: TestUser;
  let room: TestRoom;
  let playerParticipation: TestParticipation;

  test.beforeAll(async ({ browser }) => {
    owner = await TestUser.create(browser, "Alice");
    player = await TestUser.create(browser, "Bob");
    await player.interceptSocketConnections();
  });

  test.afterAll(async () => {
    await owner.context.close();
    await player.context.close();
  });

  test("player who loses the connection rejoins with their vote and name", async () => {
    await test.step("Both users join the room", async () => {
      await owner.navigateToHome();
      await owner.fillLoginForm();
      room = await TestRoom.createByUser(
        owner,
        `reconnect-room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      );
      await room.addUser(owner, "PARTICIPANT");

      await player.navigateToHome();
      await player.fillLoginForm();
      playerParticipation = await room.addUser(player, "PARTICIPANT");
      await RoomAssertions.for(room).shouldHaveParticipantCount(owner, 2);
    });

    await test.step("Player renames and votes", async () => {
      await player.openAccountMenu();
      await player.clickChangeUsername();
      await player.fillNewUsername("Bobby");
      await RoomAssertions.for(room).shouldShowParticipant(owner, "Bobby");

      await playerParticipation.castVote("5");
      await VotingAssertions.forRoom(room).shouldShowParticipantHasVoted(
        owner,
        "Bobby",
      );
    });

    const connectionsBeforeDrop = player.socketConnectionCount;

    await test.step("Player's connection drops", async () => {
      // Make sure the websocket is up, so there is a live connection to cut.
      await expect.poll(() => player.socketConnectionCount).toBeGreaterThan(0);
      await player.dropConnection();
      // The server removes a disconnected user from the room.
      await RoomAssertions.for(room).shouldHaveParticipantCount(owner, 1);
    });

    await test.step("Player reconnects and is back in the room", async () => {
      await player.restoreConnection();
      await expect
        .poll(() => player.socketConnectionCount, { timeout: 15000 })
        .toBeGreaterThan(connectionsBeforeDrop);

      await RoomAssertions.for(room).shouldHaveParticipantCount(owner, 2);
      // The rejoin uses the renamed account and keeps the vote cast before.
      await RoomAssertions.for(room).shouldShowParticipant(owner, "Bobby");
      await VotingAssertions.forRoom(room).shouldShowParticipantHasVoted(
        owner,
        "Bobby",
      );
    });

    await test.step("Player's actions still reach the room", async () => {
      await playerParticipation.revealVotes();
      await RoomAssertions.for(room).shouldShowVotingResults(owner);
    });
  });
});
