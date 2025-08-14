// Shared types for the Scrum Poker app

export type Participant = { id: string; name: string; hasVoted: boolean };

export type RoomState = {
  id: string;
  ownerId: string;
  participants: Participant[];
  status: "voting" | "revealing";
};

export type VoteProgress = Record<string, boolean>;
export type RevealedVote = { id: string; value?: number | "?" };

export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "vote:progress": (progress: VoteProgress) => void;
  "reveal:countdown": (payload: { remaining: number }) => void;
  "reveal:complete": (payload: {
    revealedVotes: RevealedVote[];
    unanimousValue?: number;
  }) => void;
  "votes:cleared": () => void;
}

export interface ClientToServerEvents {
  "room:create": (
    data: { name: string },
    cb: (resp: { roomId: string }) => void
  ) => void;
  "room:join": (
    data: { roomId: string },
    cb: (resp: { state: RoomState } | { error: string }) => void
  ) => void;
  "room:leave": (
    data: { roomId: string },
    cb?: (resp: { success: boolean }) => void
  ) => void;
  "vote:cast": (data: { roomId: string; value: number | "?" }) => void;
  "reveal:start": (data: { roomId: string }) => void;
  "vote:clear": (data: { roomId: string }) => void;
}

