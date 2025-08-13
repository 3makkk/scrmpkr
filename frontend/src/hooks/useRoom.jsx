import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getSocket } from "../socket";

// Room state reducer
const roomReducer = (state, action) => {
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

const initialRoomState = {
  roomState: null,
  error: null,
  progress: {},
  countdown: null,
  revealed: null,
  selectedCard: null,
};

// Create Room Context
const RoomContext = createContext();

// Room Provider Component
export function RoomProvider({ children }) {
  const [roomData, dispatch] = useReducer(roomReducer, initialRoomState);
  const [socket, setSocket] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);

  // Destructure for easier access
  const { roomState, error, progress, countdown, revealed, selectedCard } =
    roomData;

  // Computed values
  const isLoading = !roomState && !error;
  const votedCount = Object.keys(progress).length;
  const allVoted = roomState
    ? roomState.participants.every((p) => progress[p.id])
    : false;

  // Actions
  const joinRoom = useCallback((roomId, account) => {
    if (!account) return;

    console.log(`🔄 Joining room ${roomId}, user ${account.name}`);
    setCurrentRoomId(roomId);

    // Reset all room states when roomId changes
    dispatch({ type: "RESET_ROOM" });

    // Get or create socket connection
    const s = getSocket({ name: account.name, userId: account.id });
    setSocket(s);

    // Set a timeout to handle cases where server doesn't respond
    const joinTimeout = setTimeout(() => {
      console.log(`⏰ Join timeout for room ${roomId}`);
      dispatch({ type: "TIMEOUT_ERROR" });
    }, 10000); // 10 second timeout

    console.log(`📡 Attempting to join room ${roomId}`);
    s.emit("room:join", { roomId }, (response) => {
      clearTimeout(joinTimeout);
      console.log(`📨 Room join response for ${roomId}:`, response);

      if (response && response.error) {
        console.error("Failed to join room:", response.error);
        dispatch({ type: "SET_ERROR", payload: response.error });
      } else if (response && response.state) {
        console.log(`✅ Successfully joined room ${roomId}`);
        dispatch({ type: "SET_ROOM_STATE", payload: response.state });
      } else {
        console.error("Invalid response from server:", response);
        dispatch({
          type: "SET_ERROR",
          payload: "Invalid response from server",
        });
      }
    });

    // Set up event listeners
    const handleRoomState = (newState) => {
      console.log(`📊 Room state update for ${roomId}:`, newState);
      dispatch({ type: "SET_ROOM_STATE", payload: newState });
    };
    const handleVoteProgress = (progress) => {
      console.log(`🗳️  Vote progress for ${roomId}:`, progress);
      dispatch({ type: "SET_PROGRESS", payload: progress });
    };
    const handleRevealCountdown = ({ remaining }) => {
      console.log(`⏰ Reveal countdown: ${remaining}`);
      dispatch({ type: "SET_COUNTDOWN", payload: remaining });
    };
    const handleRevealComplete = ({ revealedVotes, unanimousValue }) => {
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

    // Return cleanup function
    return () => {
      console.log(`🧹 Cleaning up room ${roomId} listeners`);
      clearTimeout(joinTimeout);

      // Remove event listeners
      s.off("room:state", handleRoomState);
      s.off("vote:progress", handleVoteProgress);
      s.off("reveal:countdown", handleRevealCountdown);
      s.off("reveal:complete", handleRevealComplete);
      s.off("votes:cleared", handleVotesCleared);

      // Leave room but don't disconnect socket
      s.emit("room:leave", { roomId });
    };
  }, [dispatch]);

  const leaveRoom = useCallback((callback) => {
    if (socket && currentRoomId) {
      socket.emit("room:leave", { roomId: currentRoomId }, () => {
        if (callback) callback();
      });
    } else if (callback) {
      callback();
    }
  }, [socket, currentRoomId]);

  const castVote = useCallback((value) => {
    if (socket && currentRoomId) {
      dispatch({ type: "SET_SELECTED_CARD", payload: value });
      socket.emit("vote:cast", { roomId: currentRoomId, value });
    }
  }, [socket, currentRoomId, dispatch]);

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

  const retryJoin = useCallback((roomId, account) => {
    dispatch({ type: "RESET_ROOM" });

    if (socket) {
      const retryTimeout = setTimeout(() => {
        dispatch({ type: "TIMEOUT_ERROR" });
      }, 10000);

      socket.emit("room:join", { roomId }, (response) => {
        clearTimeout(retryTimeout);

        if (response.error) {
          dispatch({ type: "SET_ERROR", payload: response.error });
        } else {
          dispatch({ type: "SET_ROOM_STATE", payload: response.state });
        }
      });
    }
  }, [socket, dispatch]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log(`🔌 RoomProvider unmounting, disconnecting socket`);
      if (socket && currentRoomId) {
        socket.emit("room:leave", { roomId: currentRoomId });
        socket.disconnect();
      }
    };
  }, []);

  const contextValue = {
    // State
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

    // Actions
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

// Custom hook to use room context
export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
