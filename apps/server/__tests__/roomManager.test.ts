import { describe, it, expect, beforeEach, vi } from "vitest";
import RoomManager from "../src/roomManager";
import type { PokerNamespace } from "../src/roomManagerTypes";
import { FIB_DECK } from "../src/types";

describe("RoomManager", () => {
  let manager: RoomManager;
  let mockNamespace: PokerNamespace;

  beforeEach(() => {
    manager = new RoomManager();
    mockNamespace = {
      to: vi.fn(() => ({
        emit: vi.fn().mockReturnValue(true),
      })),
    };
  });

  describe("Room Creation", () => {
    it("creates and joins a room, normalizing the id", () => {
      const room = manager.createRoom(
        "Test-Room",
        { id: "owner-1", name: "Owner" },
        "participant"
      );
      expect(room.id).toBe("test-room");

      const joined = manager.joinRoom(
        "TEST-room",
        { id: "u1", name: "User 1" },
        "participant"
      );
      expect(joined.participants.size).toBe(2);

      const state = manager.getState("test-room");
      expect(state?.participants.map((p) => p.id)).toContain("u1");
    });

    it("creates a room with valid room names", () => {
      const validNames = ["test", "test-room", "test_room", "a", "a-b_c"];

      validNames.forEach((name, index) => {
        const room = manager.createRoom(
          name,
          { id: `owner-${index}`, name: "Owner" },
          "participant"
        );
        expect(room.id).toBe(name.toLowerCase());
      });
    });

    it("rejects invalid room names", () => {
      const invalidNames = [
        "",
        " ",
        "Test Room", // spaces
        "test@room", // special chars
        "TEST", // uppercase (should be normalized)
        "a".repeat(51), // too long
        "test!",
        "test#room",
        "room with spaces",
      ];

      invalidNames.forEach((name) => {
        if (name === "TEST") {
          // This should work due to normalization
          expect(() =>
            manager.createRoom(
              name,
              { id: "owner", name: "Owner" },
              "participant"
            )
          ).not.toThrow();
        } else {
          expect(() =>
            manager.createRoom(
              name,
              { id: "owner", name: "Owner" },
              "participant"
            )
          ).toThrow();
        }
      });
    });

    it("prevents creating duplicate rooms", () => {
      manager.createRoom(
        "test-room",
        { id: "owner-1", name: "Owner" },
        "participant"
      );

      expect(() =>
        manager.createRoom(
          "test-room",
          { id: "owner-2", name: "Owner 2" },
          "participant"
        )
      ).toThrow("Room already exists");
    });

    it("creates room with owner as first participant", () => {
      const room = manager.createRoom(
        "test-room",
        { id: "owner-1", name: "Owner" },
        "participant"
      );

      expect(room.participants.size).toBe(1);
      expect(room.participants.has("owner-1")).toBe(true);
      expect(room.creatorId).toBe("owner-1");

      const state = manager.getState("test-room");
      expect(state?.participants).toHaveLength(1);
      expect(state?.participants[0]).toEqual({
        id: "owner-1",
        name: "Owner",
        hasVoted: false,
        role: "participant",
      });
    });
  });

  describe("Room Joining", () => {
    it("allows multiple users to join a room", () => {
      const room = manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );

      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user2", name: "User 2" },
        "participant"
      );

      expect(room.participants.size).toBe(3);
      expect(Array.from(room.participants.keys())).toEqual(
        expect.arrayContaining(["owner", "user1", "user2"])
      );
    });

    it("allows same user to rejoin a room", () => {
      const room = manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );

      expect(room.participants.size).toBe(2);

      // Rejoin with same user
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1 Updated" },
        "participant"
      );

      expect(room.participants.size).toBe(2);
      expect(room.participants.get("user1")?.name).toBe("User 1 Updated");
    });

    it("validates room id when joining", () => {
      expect(() =>
        manager.joinRoom("", { id: "user", name: "User" }, "participant")
      ).toThrow("Room name is required");

      expect(() =>
        manager.joinRoom(
          "invalid@room",
          { id: "user", name: "User" },
          "participant"
        )
      ).toThrow(
        "Room name can only contain lowercase letters, hyphens, and underscores"
      );
    });
  });

  describe("Voting System", () => {
    beforeEach(() => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user2", name: "User 2" },
        "participant"
      );
    });

    it("records a vote, exposes round stats, and marks round as revealed", () => {
      manager.castVote("test-room", "user1", 5);
      manager.castVote("test-room", "owner", 5);

      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.status).toBe("revealed");
      expect(state?.currentRoundState.stats.hasConsensus).toBe(true);
      expect(state?.currentRoundState.stats.average).toBe("5.0");
    });

    it("accepts all valid Fibonacci deck values", () => {
      FIB_DECK.forEach((value, index) => {
        const userId = `user${index}`;
        manager.joinRoom(
          "test-room",
          { id: userId, name: `User ${index}` },
          "participant"
        );
        manager.castVote("test-room", userId, value);

        const state = manager.getState("test-room");
        const participant = state?.participants.find((p) => p.id === userId);
        expect(participant?.hasVoted).toBe(true);
      });
    });

    it("rejects invalid vote values", () => {
      const invalidValues = [4, 6, 7, 9, 100, -1];

      invalidValues.forEach((value) => {
        manager.castVote("test-room", "user1", value);

        const state = manager.getState("test-room");
        const participant = state?.participants.find((p) => p.id === "user1");
        expect(participant?.hasVoted).toBe(false);
      });
    });

    it("allows users to change their votes", () => {
      manager.castVote("test-room", "user1", 3);
      let state = manager.getState("test-room");
      expect(state?.currentRoundState.votes).toHaveLength(1);
      expect(state?.currentRoundState.votes[0].value).toBe(3);

      manager.castVote("test-room", "user1", 8);
      state = manager.getState("test-room");
      expect(state?.currentRoundState.votes).toHaveLength(1);
      expect(state?.currentRoundState.votes[0].value).toBe(8);
    });

    it("ignores votes from non-existent users", () => {
      manager.castVote("test-room", "nonexistent", 5);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.votes).toHaveLength(0);
    });

    it("ignores votes for non-existent rooms", () => {
      // Should not throw
      manager.castVote("nonexistent-room", "user1", 5);
    });

    it("recognizes votes via hasAnyVotes", () => {
      expect(manager.hasAnyVotes("test-room")).toBe(false);

      manager.castVote("test-room", "user1", 8);
      expect(manager.hasAnyVotes("test-room")).toBe(true);
    });

    it("handles hasAnyVotes for non-existent room", () => {
      expect(manager.hasAnyVotes("nonexistent")).toBe(false);
    });

    it("calculates statistics correctly for mixed votes", () => {
      manager.castVote("test-room", "owner", 1);
      manager.castVote("test-room", "user1", 3);
      manager.castVote("test-room", "user2", "?");

      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.stats.average).toBe("2.0"); // (1+3)/2
      expect(state?.currentRoundState.stats.hasConsensus).toBe(false);
    });

    it("calculates statistics for all unknown votes", () => {
      manager.castVote("test-room", "owner", "?");
      manager.castVote("test-room", "user1", "?");

      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.stats.average).toBe("N/A");
      expect(state?.currentRoundState.stats.hasConsensus).toBe(true);
    });

    it("handles consensus detection correctly", () => {
      manager.castVote("test-room", "owner", 5);
      manager.castVote("test-room", "user1", 5);
      manager.castVote("test-room", "user2", 5);

      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.stats.hasConsensus).toBe(true);
    });
  });

  describe("Round Management", () => {
    beforeEach(() => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );
    });

    it("resets round and increments currentRound on clearVotes", () => {
      manager.castVote("test-room", "user1", 3);

      manager.clearVotes("test-room", "owner");

      const state = manager.getState("test-room");
      expect(state?.currentRound).toBe(2);
      expect(state?.currentRoundState.votes.length).toBe(0);
      expect(
        state?.participants.every((p) => p.hasVoted === false)
      ).toBeTruthy();
    });

    it("handles clearVotes for non-existent room", () => {
      // Should not throw
      manager.clearVotes("nonexistent-room", "owner");
    });

    it("maintains round history across multiple rounds", () => {
      // Round 1
      manager.castVote("test-room", "owner", 3);
      manager.castVote("test-room", "user1", 5);
      manager.startReveal("test-room", "owner", mockNamespace);

      let state = manager.getState("test-room");
      expect(state?.currentRound).toBe(1);
      expect(state?.currentRoundState.status).toBe("revealed");

      // Round 2
      manager.clearVotes("test-room", "owner");
      state = manager.getState("test-room");
      expect(state?.currentRound).toBe(2);
      expect(state?.currentRoundState.status).toBe("voting");
      expect(state?.currentRoundState.votes).toHaveLength(0);
    });
  });

  describe("Reveal Functionality", () => {
    beforeEach(() => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );
    });

    it("emits room state when reveal starts", () => {
      manager.castVote("test-room", "owner", 5);
      manager.castVote("test-room", "user1", 5);

      manager.startReveal("test-room", "owner", mockNamespace);

      expect(mockNamespace.to).toHaveBeenCalledWith("test-room");
    });

    it("prevents reveal when no votes exist", () => {
      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.status).toBe("voting");
      expect(mockNamespace.to).not.toHaveBeenCalled();
    });

    it("handles reveal for non-existent room", () => {
      // Should not throw
      manager.startReveal("nonexistent-room", "owner", mockNamespace);
      expect(mockNamespace.to).not.toHaveBeenCalled();
    });

    it("returns unanimous value when all votes are the same", () => {
      manager.castVote("test-room", "owner", 8);
      manager.castVote("test-room", "user1", 8);

      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.stats.hasConsensus).toBe(true);
    });
  });

  describe("Room Leaving", () => {
    beforeEach(() => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user2", name: "User 2" },
        "participant"
      );
    });

    it("removes participant from room", () => {
      const result = manager.leaveRoom("test-room", "user1");

      expect(result).toEqual({ roomDeleted: false, wasInRoom: true });

      const state = manager.getState("test-room");
      expect(state?.participants).toHaveLength(2);
      expect(state?.participants.map((p) => p.id)).not.toContain("user1");
    });

    it("deletes room when last participant leaves", () => {
      manager.leaveRoom("test-room", "user1");
      manager.leaveRoom("test-room", "user2");
      const result = manager.leaveRoom("test-room", "owner");

      expect(result).toEqual({ roomDeleted: true, wasInRoom: true });
      expect(manager.getState("test-room")).toBeNull();
    });

    it("handles leaving non-existent room", () => {
      const result = manager.leaveRoom("nonexistent", "user1");
      expect(result).toBe(false);
    });

    it("handles leaving when user not in room", () => {
      const result = manager.leaveRoom("test-room", "nonexistent-user");

      expect(result).toEqual({ roomDeleted: false, wasInRoom: false });
    });

    it("normalizes room id when leaving", () => {
      const result = manager.leaveRoom("TEST-room", "user1");
      expect(result).toEqual({ roomDeleted: false, wasInRoom: true });
    });
  });

  describe("Find User Room", () => {
    beforeEach(() => {
      manager.createRoom(
        "room-one",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "room-one",
        { id: "user1", name: "User 1" },
        "participant"
      );
      manager.joinRoom(
        "room-one",
        { id: "user2", name: "User 2" },
        "participant"
      );
    });

    it("finds the room a user is in", () => {
      const roomId = manager.findUserRoom("user2");
      expect(roomId).toBe("room-one");
    });

    it("returns null for user not in any room", () => {
      const roomId = manager.findUserRoom("nonexistent-user");
      expect(roomId).toBeNull();
    });

    it("user can leave their room via disconnect flow", () => {
      // Simulate disconnect: find room and leave
      const roomId = manager.findUserRoom("user2");
      expect(roomId).toBe("room-one");

      if (roomId) {
        const result = manager.leaveRoom(roomId, "user2");
        expect(result).toEqual({ roomDeleted: false, wasInRoom: true });
      }

      const roomState = manager.getState("room-one");
      expect(roomState?.participants.map((p) => p.id)).not.toContain("user2");
    });

    it("deletes room when last user leaves via disconnect", () => {
      // Create a room where a user is the only participant
      manager.createRoom(
        "solo-room",
        { id: "solo-user", name: "Solo User" },
        "participant"
      );

      const roomId = manager.findUserRoom("solo-user");
      expect(roomId).toBe("solo-room");

      if (roomId) {
        const result = manager.leaveRoom(roomId, "solo-user");
        expect(result).toEqual({ roomDeleted: true, wasInRoom: true });
      }

      expect(manager.getState("solo-room")).toBeNull();
    });
  });

  describe("State Management", () => {
    it("returns null for non-existent room state", () => {
      expect(manager.getState("nonexistent")).toBeNull();
    });

    it("returns complete room state", () => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner Name" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );
      manager.castVote("test-room", "owner", 5);

      const state = manager.getState("test-room");

      expect(state).toEqual({
        id: "test-room",
        creatorId: "owner",
        participants: [
          {
            id: "owner",
            name: "Owner Name",
            hasVoted: true,
            role: "participant",
          },
          { id: "user1", name: "User 1", hasVoted: false, role: "participant" },
        ],
        status: "voting",
        currentRound: 1,
        currentRoundState: {
          round: 1,
          status: "voting",
          votes: [{ id: "owner", name: "Owner Name", value: 5 }],
          stats: expect.any(Object),
        },
      });
    });

    it("normalizes room id for state retrieval", () => {
      manager.createRoom(
        "Test-Room",
        { id: "owner", name: "Owner" },
        "participant"
      );

      expect(manager.getState("test-room")).not.toBeNull();
      expect(manager.getState("TEST-room")).not.toBeNull();
      expect(manager.getState("Test-Room")).not.toBeNull();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles empty strings gracefully", () => {
      expect(() =>
        manager.createRoom("", { id: "", name: "" }, "participant")
      ).toThrow();
      expect(() =>
        manager.joinRoom("", { id: "", name: "" }, "participant")
      ).toThrow();
    });

    it("handles whitespace-only strings", () => {
      expect(() =>
        manager.createRoom("   ", { id: "   ", name: "   " }, "participant")
      ).toThrow();
    });

    it("handles very long room names", () => {
      const longName = "a".repeat(51);
      expect(() =>
        manager.createRoom(
          longName,
          { id: "owner", name: "Owner" },
          "participant"
        )
      ).toThrow();
    });

    it("maintains consistency across operations", () => {
      // Create room with mixed case
      const room = manager.createRoom(
        "Test-Room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      expect(room.id).toBe("test-room");

      // Join with different case
      manager.joinRoom(
        "TEST-room",
        { id: "user1", name: "User 1" },
        "participant"
      );

      // Vote with yet another case
      manager.castVote("Test-ROOM", "user1", 5);

      // Check state with original case
      const state = manager.getState("test-room");
      expect(state?.participants).toHaveLength(2);
      expect(state?.currentRoundState.votes).toHaveLength(1);
    });

    it("handles special characters in user names", () => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        {
          id: "user1",
          name: "User with émojis 🎉",
        },
        "participant"
      );

      const state = manager.getState("test-room");
      expect(state?.participants[1].name).toBe("User with émojis 🎉");
    });

    it("handles numeric user IDs as strings", () => {
      manager.createRoom(
        "test-room",
        { id: "123", name: "Numeric Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "456", name: "Numeric User" },
        "participant"
      );

      const state = manager.getState("test-room");
      expect(state?.participants).toHaveLength(2);
    });

    it("handles concurrent voting and revealing", () => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );

      manager.castVote("test-room", "owner", 5);
      manager.castVote("test-room", "user1", 5);

      // Start reveal
      manager.startReveal("test-room", "owner", mockNamespace);

      let state = manager.getState("test-room");
      expect(state?.currentRoundState.status).toBe("revealed");

      // Vote after reveal resets status to voting
      manager.castVote("test-room", "user1", 8);

      state = manager.getState("test-room");
      expect(state?.currentRoundState.status).toBe("voting"); // Status resets when new vote comes in
      expect(
        state?.currentRoundState.votes.find((v) => v.id === "user1")?.value
      ).toBe(8);
    });

    it("handles multiple reveals on same round", () => {
      manager.createRoom(
        "test-room",
        { id: "owner", name: "Owner" },
        "participant"
      );
      manager.joinRoom(
        "test-room",
        { id: "user1", name: "User 1" },
        "participant"
      );

      manager.castVote("test-room", "owner", 5);
      manager.castVote("test-room", "user1", 3);

      // Multiple reveals should be safe
      manager.startReveal("test-room", "owner", mockNamespace);
      manager.startReveal("test-room", "owner", mockNamespace);
      manager.startReveal("test-room", "owner", mockNamespace);

      const state = manager.getState("test-room");
      expect(state?.currentRoundState.status).toBe("revealed");
      expect(state?.currentRoundState.votes).toHaveLength(2);
    });

    it("handles large number of participants", () => {
      manager.createRoom(
        "large-room",
        { id: "owner", name: "Owner" },
        "participant"
      );

      // Add many participants
      for (let i = 1; i <= 100; i++) {
        manager.joinRoom(
          "large-room",
          { id: `user${i}`, name: `User ${i}` },
          "participant"
        );
      }

      const state = manager.getState("large-room");
      expect(state?.participants).toHaveLength(101); // owner + 100 users
    });

    it("handles room name edge cases correctly", () => {
      // Test minimum length
      const room = manager.createRoom(
        "a",
        { id: "owner", name: "Owner" },
        "participant"
      );
      expect(room.id).toBe("a");

      // Test maximum length
      const maxName = "a".repeat(50);
      const room2 = manager.createRoom(
        maxName,
        { id: "owner2", name: "Owner 2" },
        "participant"
      );
      expect(room2.id).toBe(maxName);

      // Test with hyphens and underscores
      const room3 = manager.createRoom(
        "test-room_name",
        { id: "owner3", name: "Owner 3" },
        "participant"
      );
      expect(room3.id).toBe("test-room_name");
    });

    it("handles vote statistics edge cases", () => {
      manager.createRoom(
        "stats-room",
        { id: "owner", name: "Owner" },
        "participant"
      );

      // Test with only "?" votes
      manager.castVote("stats-room", "owner", "?");
      manager.startReveal("stats-room", "owner", mockNamespace);

      let state = manager.getState("stats-room");
      expect(state?.currentRoundState.stats.average).toBe("N/A");
      expect(state?.currentRoundState.stats.hasConsensus).toBe(true);

      // Reset for next test
      manager.clearVotes("stats-room", "owner");
      manager.joinRoom(
        "stats-room",
        { id: "user1", name: "User 1" },
        "participant"
      );

      // Test with mixed numeric and "?" votes
      manager.castVote("stats-room", "owner", 5);
      manager.castVote("stats-room", "user1", "?");
      manager.startReveal("stats-room", "owner", mockNamespace);

      state = manager.getState("stats-room");
      expect(state?.currentRoundState.stats.average).toBe("5.0");
      expect(state?.currentRoundState.stats.hasConsensus).toBe(false);
    });
  });
});
