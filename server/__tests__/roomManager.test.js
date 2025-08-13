const { RoomManager, FIB_DECK } = require("../roomManager");

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
