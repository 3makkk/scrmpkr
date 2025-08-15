import {
  createContext,
  useContext,
  useReducer,
  useEffect,
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
  | { type: "SET_COUNTDOWN"; payload: number | null }
  | { type: "SET_REVEALED"; payload: RevealedVote[] | null }
  | { type: "SET_SELECTED_CARD"; payload: number | "?" | null }
  | { type: "CLEAR_VOTES" }
  | { type: "TIMEOUT_ERROR" };

type RoomData = {
  roomState: RoomState | null;
  error: string | null;
  progress: Progress;
  countdown: number | null;
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
        countdown: null,
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
    case "SET_COUNTDOWN":
      return {
        ...state,
        countdown: action.payload,
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
        countdown: null,
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
  countdown: null,
  revealed: null,
  selectedCard: null,
};

type RoomContextValue = {
  roomState: RoomState | null;
  error: string | null;
  progress: Progress;
  countdown: number | null;
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
  retryJoin: (roomId: string, account: { id: string; name: string }) => void;
};

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [roomData, dispatch] = useReducer(roomReducer, initialRoomState);
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const { roomState, error, progress, countdown, revealed, selectedCard } =
    roomData;

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

      const s = getSocket({ name: account.name, userId: account.id });
      setSocket(s);

      const joinTimeout = setTimeout(() => {
        console.log(`⏰ Join timeout for room ${roomId}`);
        dispatch({ type: "TIMEOUT_ERROR" });
      }, 10000);

      console.log(`📡 Attempting to join room ${roomId}`);
      s.emit("room:join", { roomId }, (response) => {
        clearTimeout(joinTimeout);
        console.log(`📨 Room join response for ${roomId}:`, response);

        if ("error" in response) {
          console.error("Failed to join room:", response.error);
          dispatch({ type: "SET_ERROR", payload: response.error });
        } else if ("state" in response) {
          console.log(`✅ Successfully joined room ${roomId}`);
          dispatch({ type: "SET_ROOM_STATE", payload: response.state });
        }
      });

      const handleRoomState = (newState: RoomState) => {
        console.log(`📊 Room state update for ${roomId}:`, newState);
        dispatch({ type: "SET_ROOM_STATE", payload: newState });
      };
      const handleVoteProgress = (progress: Progress) => {
        console.log(`🗳️  Vote progress for ${roomId}:`, progress);
        dispatch({ type: "SET_PROGRESS", payload: progress });
      };
      const handleRevealCountdown = ({ remaining }: { remaining: number }) => {
        console.log(`⏰ Reveal countdown: ${remaining}`);
        dispatch({ type: "SET_COUNTDOWN", payload: remaining });
      };
      const handleRevealComplete = ({
        revealedVotes,
        unanimousValue,
      }: {
        revealedVotes: RevealedVote[];
        unanimousValue?: number;
      }) => {
        console.log(`🎉 Reveal complete for ${roomId}`);
        dispatch({ type: "SET_REVEALED", payload: revealedVotes });
        if (unanimousValue !== undefined) {
          import("canvas-confetti").then((m) => m.default());
        }
      };
      const handleVotesCleared = () => {
        console.log(`🧹 Votes cleared for ${roomId}`);
        dispatch({ type: "CLEAR_VOTES" });
      };

      s.on("room:state", handleRoomState);
      s.on("vote:progress", handleVoteProgress);
      s.on("reveal:countdown", handleRevealCountdown);
      s.on("reveal:complete", handleRevealComplete);
      s.on("votes:cleared", handleVotesCleared);

      return () => {
        console.log(`🧹 Cleaning up room ${roomId} listeners`);
        clearTimeout(joinTimeout);
        s.off("room:state", handleRoomState);
        s.off("vote:progress", handleVoteProgress);
        s.off("reveal:countdown", handleRevealCountdown);
        s.off("reveal:complete", handleRevealComplete);
        s.off("votes:cleared", handleVotesCleared);
        s.emit("room:leave", { roomId });
      };
    },
    [],
  );

  const leaveRoom = useCallback(
    (callback?: () => void) => {
      if (socket && currentRoomId) {
        socket.emit("room:leave", { roomId: currentRoomId }, () => {
          if (callback) callback();
        });
      } else if (callback) {
        callback();
      }
    },
    [socket, currentRoomId],
  );

  const castVote = useCallback(
    (value: number | "?") => {
      if (socket && currentRoomId) {
        dispatch({ type: "SET_SELECTED_CARD", payload: value });
        socket.emit("vote:cast", { roomId: currentRoomId, value });
      }
    },
    [socket, currentRoomId],
  );

  const revealVotes = useCallback(() => {
    if (socket && currentRoomId) {
      socket.emit("reveal:start", { roomId: currentRoomId });
    }
  }, [socket, currentRoomId]);

  const clearVotes = useCallback(() => {
    if (socket && currentRoomId) {
      socket.emit("vote:clear", { roomId: currentRoomId });
    }
  }, [socket, currentRoomId]);

  const retryJoin = useCallback(
    (roomId: string, _account: { id: string; name: string }) => {
      dispatch({ type: "RESET_ROOM" });

      if (socket) {
        const retryTimeout = setTimeout(() => {
          dispatch({ type: "TIMEOUT_ERROR" });
        }, 10000);

        socket.emit("room:join", { roomId }, (response) => {
          clearTimeout(retryTimeout);
          if ("error" in response) {
            dispatch({ type: "SET_ERROR", payload: response.error });
          } else {
            dispatch({ type: "SET_ROOM_STATE", payload: response.state });
          }
        });
      }
    },
    [socket],
  );

  useEffect(() => {
    return () => {
      console.log(`🔌 RoomProvider unmounting, disconnecting socket`);
      if (socket && currentRoomId) {
        socket.emit("room:leave", { roomId: currentRoomId });
        socket.disconnect();
      }
    };
  }, [socket, currentRoomId]);

  const contextValue: RoomContextValue = {
    roomState,
    error,
    progress,
    countdown,
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
    retryJoin,
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
