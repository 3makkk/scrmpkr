import { RoomManager, FIB_DECK } from "../roomManager";

test("create and join room", () => {
  const rm = new RoomManager();
  const room = rm.createRoom("owner", "Alice");
  expect(room.ownerId).toBe("owner");
  rm.joinRoom(room.id, { id: "bob", name: "Bob" });
  const state = rm.getState(room.id);
  expect(state.participants).toHaveLength(2);
});

test("cast vote and progress", () => {
  const rm = new RoomManager();
  const room = rm.createRoom("owner", "Alice");
  rm.castVote(room.id, "owner", FIB_DECK[3]);
  const progress = rm.getProgress(room.id);
  expect(progress.owner).toBe(true);
});

test("clear votes resets progress", () => {
  const rm = new RoomManager();
  const room = rm.createRoom("owner", "Alice");
  rm.joinRoom(room.id, { id: "bob", name: "Bob" });
  rm.castVote(room.id, "owner", FIB_DECK[2]);
  rm.castVote(room.id, "bob", FIB_DECK[3]);
  // Sanity check votes recorded
  let progress = rm.getProgress(room.id);
  expect(progress.owner).toBe(true);
  expect(progress.bob).toBe(true);
  // Clear and verify all false
  rm.clearVotes(room.id);
  progress = rm.getProgress(room.id);
  expect(progress.owner).toBe(false);
  expect(progress.bob).toBe(false);
});
