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
  VoteProgress as Progress,
  RevealedVote,
} from "@scrmpkr/shared";

type RoomAction =
  | { type: "RESET_ROOM" }
  | { type: "SET_ROOM_STATE"; payload: RoomState }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_PROGRESS"; payload: Progress }
  | { type: "SET_REVEALED"; payload: RevealedVote[] | null }
  | { type: "SET_SELECTED_CARD"; payload: number | "?" | null }
  | { type: "CLEAR_VOTES" }
  | { type: "TIMEOUT_ERROR" };

type RoomData = {
  roomState: RoomState | null;
  error: string | null;
  progress: Progress;
  revealed: RevealedVote[] | null;
  selectedCard: number | "?" | null;
};

const roomReducer = (state: RoomData, action: RoomAction): RoomData => {
  switch (action.type) {
    case "RESET_ROOM":
      return {
        roomState: null,
        error: null,
        progress: {},
        revealed: null,
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
    case "SET_PROGRESS":
      return {
        ...state,
        progress: action.payload,
      };
    case "SET_REVEALED":
      return {
        ...state,
        revealed: action.payload,
      };
    case "SET_SELECTED_CARD":
      return {
        ...state,
        selectedCard: action.payload,
      };
    case "CLEAR_VOTES":
      return {
        ...state,
        revealed: null,
        selectedCard: null,
        progress: {},
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
  progress: {},
  revealed: null,
  selectedCard: null,
};

type RoomContextValue = {
  roomState: RoomState | null;
  error: string | null;
  progress: Progress;
  revealed: RevealedVote[] | null;
  selectedCard: number | "?" | null;
  isLoading: boolean;
  votedCount: number;
  allVoted: boolean;
  currentRoomId: string | null;
  joinRoom: (
    roomId: string,
    account: { id: string; name: string },
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
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const { roomState, error, progress, revealed, selectedCard } = roomData;

  const isLoading = !roomState && !error;
  const votedCount = Object.values(progress).filter(Boolean).length;
  const allVoted = roomState
    ? roomState.participants.every((p) => progress[p.id])
    : false;

  const joinRoom = useCallback(
    (roomId: string, account: { id: string; name: string }) => {
      if (!account) return () => {};

      console.log(`🔄 Joining room ${roomId}, user ${account.name}`);
      setCurrentRoomId(roomId);

      dispatch({ type: "RESET_ROOM" });

      // Use a persistent user socket
      const s = getSocket({ name: account.name, userId: account.id });
      socketRef.current = s;

      let joinTimeout: NodeJS.Timeout | null = null;
      const startJoin = () => {
        console.log(`📡 Attempting to join room ${roomId}`);
        joinTimeout = setTimeout(() => {
          console.log(`⏰ Join timeout for room ${roomId}`);
          dispatch({ type: "TIMEOUT_ERROR" });
        }, 10000);
        s.emit("room:join", { roomId }, (response) => {
          if (joinTimeout) clearTimeout(joinTimeout);
          console.log(`📨 Room join response for ${roomId}:`, response);

          if ("error" in response) {
            console.error("Failed to join room:", response.error);
            dispatch({ type: "SET_ERROR", payload: response.error });
          } else if ("state" in response) {
            console.log(`✅ Successfully joined room ${roomId}`);
            dispatch({ type: "SET_ROOM_STATE", payload: response.state });
          }
        });
      };

      if (s.connected) startJoin();
      else s.once("connect", startJoin);

      const handleRoomState = (newState: RoomState) => {
        console.log(`📊 Room state update for ${roomId}:`, newState);
        dispatch({ type: "SET_ROOM_STATE", payload: newState });
      };
      const handleVoteProgress = (progress: Progress) => {
        console.log(`🗳️  Vote progress for ${roomId}:`, progress);
        dispatch({ type: "SET_PROGRESS", payload: progress });
      };
      const handleRevealComplete = ({
        revealedVotes,
      }: {
        revealedVotes: RevealedVote[];
        unanimousValue?: number;
      }) => {
        console.log(`🎉 Reveal complete for ${roomId}`);
        dispatch({ type: "SET_REVEALED", payload: revealedVotes });
      };
      const handleVotesCleared = () => {
        console.log(`🧹 Votes cleared for ${roomId}`);
        dispatch({ type: "CLEAR_VOTES" });
      };

      s.on("room:state", handleRoomState);
      s.on("vote:progress", handleVoteProgress);
      s.on("reveal:complete", handleRevealComplete);
      s.on("votes:cleared", handleVotesCleared);

      return () => {
        console.log(`🧹 Cleaning up room ${roomId} listeners`);
        if (joinTimeout) clearTimeout(joinTimeout);
        s.off("connect", startJoin);
        s.off("room:state", handleRoomState);
        s.off("vote:progress", handleVoteProgress);
        s.off("reveal:complete", handleRevealComplete);
        s.off("votes:cleared", handleVotesCleared);
      };
    },
    [],
  );

  const leaveRoom = useCallback(
    (callback?: () => void) => {
      const s = socketRef.current;
      if (s && currentRoomId) {
        s.emit("room:leave", { roomId: currentRoomId }, () => {
          if (callback) callback();
        });
        setCurrentRoomId(null);
        dispatch({ type: "RESET_ROOM" });
      } else if (callback) {
        callback();
      }
    },
    [currentRoomId],
  );

  const castVote = useCallback(
    (value: number | "?") => {
      const s = socketRef.current;
      if (s && currentRoomId) {
        dispatch({ type: "SET_SELECTED_CARD", payload: value });
        s.emit("vote:cast", { roomId: currentRoomId, value });
      }
    },
    [currentRoomId],
  );

  const revealVotes = useCallback(() => {
    const s = socketRef.current;
    if (s && currentRoomId) {
      s.emit("reveal:start", { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const clearVotes = useCallback(() => {
    const s = socketRef.current;
    if (s && currentRoomId) {
      s.emit("vote:clear", { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const contextValue: RoomContextValue = {
    roomState,
    error,
    progress,
    revealed,
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
