import type { RoomState } from "@scrmpkr/shared";

export type PokerNamespace = {
  to(roomId: string): {
    emit: {
      (ev: "room:state", state: RoomState): boolean;
      (ev: "votes:cleared"): boolean;
    };
  };
};
