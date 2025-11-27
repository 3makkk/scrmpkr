import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useState,
  useCallback,
} from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "../socket";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomState,
  UserRole,
} from "@scrmpkr/shared";

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
    role?: UserRole,
  ) => () => void;
  leaveRoom: (callback?: () => void) => void;
  castVote: (value: number | "?") => void;
  revealVotes: () => void;
  clearVotes: () => void;
};

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
  const votedCount = roomState
    ? roomState.participants.filter((participant) => participant.hasVoted)
        .length
    : 0;
  const allVoted = roomState
    ? roomState.participants.length > 0 &&
      roomState.participants.every((participant) => participant.hasVoted)
    : false;

  const joinRoom = useCallback(
    (
      roomId: string,
      account: { id: string; name: string },
      role?: UserRole,
    ) => {
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

      let joinTimeout: NodeJS.Timeout | null = null;
      const startJoin = () => {
        joinTimeout = setTimeout(() => {
          dispatch({ type: "TIMEOUT_ERROR" });
        }, 10000);
        socket.emit(
          "room:join",
          { roomId: normalizedRoomId, role },
          (response) => {
            if (joinTimeout) clearTimeout(joinTimeout);

            if ("error" in response) {
              dispatch({ type: "SET_ERROR", payload: response.error });
            } else if ("state" in response) {
              dispatch({ type: "SET_ROOM_STATE", payload: response.state });
            }
          },
        );
      };

      if (socket.connected) startJoin();
      else socket.once("connect", startJoin);

      const handleRoomState = (newState: RoomState) => {
        dispatch({ type: "SET_ROOM_STATE", payload: newState });
      };
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
        socket.emit("room:leave", { roomId: currentRoomId }, () => {
          if (callback) callback();
        });
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
      if (socket && currentRoomId) {
        dispatch({ type: "SET_SELECTED_CARD", payload: value });
        socket.emit("vote:cast", { roomId: currentRoomId, value });
      }
    },
    [currentRoomId],
  );

  const revealVotes = useCallback(() => {
    const socket = socketRef.current;
    if (socket && currentRoomId) {
      socket.emit("reveal:start", { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const clearVotes = useCallback(() => {
    const socket = socketRef.current;
    if (socket && currentRoomId) {
      socket.emit("vote:clear", { roomId: currentRoomId });
    }
  }, [currentRoomId]);

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
