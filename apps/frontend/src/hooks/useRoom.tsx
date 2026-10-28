import type { RoomState, UserRole } from "@scrmpkr/shared";
import { canVote } from "@scrmpkr/shared";
import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import { getSocket, type PokerSocket, setSocketAuthName } from "../socket";

type RoomAction =
  | { type: "RESET_ROOM" }
  | { type: "SET_ROOM_STATE"; payload: RoomState }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SELECTED_CARD"; payload: number | "?" | null };

type RoomData = {
  roomState: RoomState | null;
  error: string | null;
  selectedCard: number | "?" | null;
};

const initialRoomState: RoomData = {
  roomState: null,
  error: null,
  selectedCard: null,
};

const roomReducer = (state: RoomData, action: RoomAction): RoomData => {
  switch (action.type) {
    case "RESET_ROOM":
      return initialRoomState;
    case "SET_ROOM_STATE":
      return { ...state, roomState: action.payload, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, roomState: null };
    case "SET_SELECTED_CARD":
      return { ...state, selectedCard: action.payload };
    default:
      return state;
  }
};

type RoomContextValue = RoomData & {
  isLoading: boolean;
  votedCount: number;
  allVoted: boolean;
  joinRoom: (
    roomId: string,
    account: { id: string; name: string },
    role: UserRole,
  ) => () => void;
  leaveRoom: (callback?: () => void) => void;
  castVote: (value: number | "?") => void;
  revealVotes: () => void;
  clearVotes: () => void;
  updateRole: (newRole: UserRole) => void;
  updateName: (newName: string) => void;
};

const JOIN_TIMEOUT_MS = 10000;
const LEAVE_TIMEOUT_MS = 3000;

// Room actions are only sent while connected: socket.io buffers emits made
// while disconnected and flushes them on reconnect before the rejoin, so the
// server would reject them.
const connected = (socket: PokerSocket | null) =>
  socket?.connected ? socket : null;

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [roomData, dispatch] = useReducer(roomReducer, initialRoomState);
  const socketRef = useRef<PokerSocket | null>(null);
  // Set while a room is joined; tears down that room's listeners.
  const cleanupRef = useRef<(() => void) | null>(null);

  const { roomState, error } = roomData;

  const isLoading = !roomState && !error;
  const voters = roomState
    ? roomState.participants.filter((participant) => canVote(participant.role))
    : [];
  const votedCount = voters.filter(
    (participant) => participant.hasVoted,
  ).length;
  const allVoted = voters.length > 0 && voters.every((p) => p.hasVoted);

  const joinRoom = useCallback(
    (roomId: string, account: { id: string; name: string }, role: UserRole) => {
      if (!account) return () => {};

      const normalizedRoomId = roomId.trim().toLowerCase();

      cleanupRef.current?.();
      dispatch({ type: "RESET_ROOM" });

      // Use a persistent user socket
      const socket = getSocket({ name: account.name, userId: account.id });
      socketRef.current = socket;

      // The role to (re)join with. Starts as the role picked on entry and
      // follows the server state, so a reconnect keeps a role changed later.
      let joinRole = role;
      let active = true;

      const handleRoomState = (newState: RoomState) => {
        // The socket may still receive state for a room it was in before.
        if (newState.id !== normalizedRoomId) return;
        const self = newState.participants.find(
          (participant) => participant.id === account.id,
        );
        if (self) joinRole = self.role;
        dispatch({ type: "SET_ROOM_STATE", payload: newState });
      };

      // Covers the whole join, including waiting for the socket to connect.
      let joinTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        console.log("[useRoom] Join timeout");
        dispatch({
          type: "SET_ERROR",
          payload: "Connection timeout - unable to join room",
        });
      }, JOIN_TIMEOUT_MS);

      // Runs on the first connect and again after every reconnect: the server
      // drops the user from the room when their socket disconnects, so without
      // rejoining the client would keep a stale room.
      const startJoin = () => {
        console.log("[useRoom] Emitting room:join", {
          normalizedRoomId,
          role: joinRole,
        });
        socket.emit(
          "room:join",
          { roomId: normalizedRoomId, role: joinRole },
          (response) => {
            if (!active) return;
            if (joinTimeout) {
              clearTimeout(joinTimeout);
              joinTimeout = null;
            }

            console.log("[useRoom] room:join response:", response);
            if ("error" in response) {
              dispatch({ type: "SET_ERROR", payload: response.error });
            } else {
              handleRoomState(response.state);
            }
          },
        );
      };

      const handleVotesCleared = () => {
        dispatch({ type: "SET_SELECTED_CARD", payload: null });
      };
      const handleForceDisconnect = ({ reason }: { reason?: string }) => {
        dispatch({
          type: "SET_ERROR",
          payload: reason || "You were disconnected",
        });
        cleanupRef.current?.();
        socket.disconnect();
      };

      socket.on("connect", startJoin);
      socket.on("room:state", handleRoomState);
      socket.on("votes:cleared", handleVotesCleared);
      socket.on("force:disconnect", handleForceDisconnect);
      if (socket.connected) startJoin();

      const cleanup = () => {
        active = false;
        if (joinTimeout) clearTimeout(joinTimeout);
        socket.off("connect", startJoin);
        socket.off("room:state", handleRoomState);
        socket.off("votes:cleared", handleVotesCleared);
        socket.off("force:disconnect", handleForceDisconnect);
        cleanupRef.current = null;
      };

      cleanupRef.current = cleanup;

      return cleanup;
    },
    [],
  );

  const leaveRoom = useCallback((callback?: () => void) => {
    const socket = socketRef.current;
    const wasInRoom = cleanupRef.current !== null;
    cleanupRef.current?.();
    dispatch({ type: "RESET_ROOM" });

    // When disconnected the server has already removed us from the room.
    if (!wasInRoom || !socket?.connected) {
      callback?.();
      return;
    }
    // Don't block navigation on an ack that may never come.
    socket.timeout(LEAVE_TIMEOUT_MS).emit("room:leave", () => callback?.());
  }, []);

  const castVote = useCallback((value: number | "?") => {
    const socket = connected(socketRef.current);
    if (!socket) return;
    dispatch({ type: "SET_SELECTED_CARD", payload: value });
    socket.emit("vote:cast", { value });
  }, []);

  const revealVotes = useCallback(() => {
    connected(socketRef.current)?.emit("reveal:start");
  }, []);

  const clearVotes = useCallback(() => {
    connected(socketRef.current)?.emit("vote:clear");
  }, []);

  const updateRole = useCallback((newRole: UserRole) => {
    connected(socketRef.current)?.emit("user:updateRole", { newRole });
  }, []);

  const updateName = useCallback((newName: string) => {
    setSocketAuthName(newName);
    connected(socketRef.current)?.emit(
      "user:updateName",
      { newName },
      (response) => {
        if (response && "error" in response) {
          console.error("Failed to update username:", response.error);
        }
      },
    );
  }, []);

  const contextValue: RoomContextValue = {
    ...roomData,
    isLoading,
    votedCount,
    allVoted,
    joinRoom,
    leaveRoom,
    castVote,
    revealVotes,
    clearVotes,
    updateRole,
    updateName,
  };

  return (
    <RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
