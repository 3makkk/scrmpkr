import type {
  ClientToServerEvents,
  RoomState,
  ServerToClientEvents,
  UserRole,
} from "@scrmpkr/shared";
import { canVote } from "@scrmpkr/shared";
import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "../socket";

type RoomAction =
  | { type: "RESET_ROOM" }
  | { type: "SET_ROOM_STATE"; payload: RoomState }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_SELECTED_CARD"; payload: number | "?" | null }
  | { type: "CLEAR_SELECTED_CARD" }
  | { type: "TIMEOUT_ERROR" };

type RoomData = {
  roomState: RoomState | null;
  error: string | null;
  selectedCard: number | "?" | null;
};

const roomReducer = (state: RoomData, action: RoomAction): RoomData => {
  switch (action.type) {
    case "RESET_ROOM":
      return {
        roomState: null,
        error: null,
        selectedCard: null,
      };
    case "SET_ROOM_STATE":
      return {
        ...state,
        roomState: action.payload,
        error: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        roomState: null,
      };
    case "SET_SELECTED_CARD":
      return {
        ...state,
        selectedCard: action.payload,
      };
    case "CLEAR_SELECTED_CARD":
      return {
        ...state,
        selectedCard: null,
      };
    case "TIMEOUT_ERROR":
      return {
        ...state,
        error: "Connection timeout - unable to join room",
        roomState: null,
      };
    default:
      return state;
  }
};

const initialRoomState: RoomData = {
  roomState: null,
  error: null,
  selectedCard: null,
};

type RoomContextValue = {
  roomState: RoomState | null;
  error: string | null;
  selectedCard: number | "?" | null;
  isLoading: boolean;
  votedCount: number;
  allVoted: boolean;
  currentRoomId: string | null;
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

const LEAVE_TIMEOUT_MS = 3000;

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [roomData, dispatch] = useReducer(roomReducer, initialRoomState);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const { roomState, error, selectedCard } = roomData;

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
      setCurrentRoomId(normalizedRoomId);

      dispatch({ type: "RESET_ROOM" });

      // Use a persistent user socket
      const socket = getSocket({ name: account.name, userId: account.id });
      socketRef.current = socket;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

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
        dispatch({ type: "TIMEOUT_ERROR" });
      }, 10000);

      // Runs on the first connect and again after every reconnect: the server
      // drops the user from the room when their socket disconnects, so without
      // rejoining the client would keep a stale room and its actions would be
      // rejected.
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
            } else if ("state" in response) {
              handleRoomState(response.state);
            }
          },
        );
      };

      socket.on("connect", startJoin);
      if (socket.connected) startJoin();

      const handleVotesCleared = () => {
        dispatch({ type: "CLEAR_SELECTED_CARD" });
      };
      const handleForceDisconnect = ({ reason }: { reason?: string }) => {
        dispatch({
          type: "SET_ERROR",
          payload: reason || "You were disconnected",
        });
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
        socket.disconnect();
      };

      socket.on("room:state", handleRoomState);
      socket.on("votes:cleared", handleVotesCleared);
      socket.on("force:disconnect", handleForceDisconnect);

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

  const leaveRoom = useCallback(
    (callback?: () => void) => {
      const socket = socketRef.current;
      if (socket && currentRoomId) {
        if (socket.connected) {
          // Don't block navigation on an ack that may never come.
          socket
            .timeout(LEAVE_TIMEOUT_MS)
            .emit("room:leave", { roomId: currentRoomId }, () => {
              if (callback) callback();
            });
        } else if (callback) {
          // The server already removed us from the room on disconnect.
          callback();
        }
        setCurrentRoomId(null);
        dispatch({ type: "RESET_ROOM" });
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      } else if (callback) {
        callback();
      }
    },
    [currentRoomId],
  );

  const castVote = useCallback(
    (value: number | "?") => {
      const socket = socketRef.current;
      if (socket?.connected && currentRoomId) {
        dispatch({ type: "SET_SELECTED_CARD", payload: value });
        socket.emit("vote:cast", { roomId: currentRoomId, value });
      }
    },
    [currentRoomId],
  );

  const revealVotes = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected && currentRoomId) {
      socket.emit("reveal:start", { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const clearVotes = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.connected && currentRoomId) {
      socket.emit("vote:clear", { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const updateRole = useCallback(
    (newRole: UserRole) => {
      const socket = socketRef.current;
      if (socket?.connected && currentRoomId) {
        socket.emit("user:updateRole", { roomId: currentRoomId, newRole });
      }
    },
    [currentRoomId],
  );

  const updateName = useCallback(
    (newName: string) => {
      const socket = socketRef.current;
      if (!socket) return;
      // Reconnects re-send the handshake auth; keep the name there current or
      // the server would revert to the old name after a reconnect.
      socket.auth = { ...(socket.auth as object), name: newName };
      if (socket.connected && currentRoomId) {
        socket.emit(
          "user:updateName",
          { roomId: currentRoomId, newName },
          (response) => {
            if (response && "error" in response) {
              console.error(
                "Failed to update username in room:",
                response.error,
              );
            }
          },
        );
      }
    },
    [currentRoomId],
  );

  const contextValue: RoomContextValue = {
    roomState,
    error,
    selectedCard,
    isLoading,
    votedCount,
    allVoted,
    currentRoomId,
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
