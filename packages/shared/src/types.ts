// Core types for the Scrum Poker app

export const UserRole = {
  PARTICIPANT: "participant",
  VISITOR: "visitor",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type Participant = {
  id: string;
  name: string;
  hasVoted: boolean;
  role: UserRole;
};

export type RoundStatus = "voting" | "revealed";
export type RoundVote = { id: string; name: string; value?: number | "?" };
export type RoundStats = {
  average: string;
  hasConsensus: boolean;
  mostCommon: number | "?" | null;
  showMostCommon: boolean;
};
export type RoundState = {
  round: number;
  status: RoundStatus;
  votes: RoundVote[];
  stats: RoundStats;
};
export type RevealedVote = RoundVote;

export type RoomState = {
  id: string;
  creatorId: string;
  participants: Participant[];
  status: "voting";
  currentRound: number;
  currentRoundState: RoundState;
};

export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "votes:cleared": () => void;
  "force:disconnect": (payload: { reason?: string }) => void;
}

export interface ClientToServerEvents {
  "room:exists": (
    data: { roomId: string },
    cb: (resp: { exists: boolean }) => void,
  ) => void;
  "room:create": (
    data: { roomName: string },
    cb: (resp: { roomId: string } | { error: string }) => void,
  ) => void;
  "room:join": (
    data: { roomId: string; role?: UserRole },
    cb: (resp: { state: RoomState } | { error: string }) => void,
  ) => void;
  "room:leave": (
    data: { roomId: string },
    cb?: (resp: { success: boolean }) => void,
  ) => void;
  "user:updateName": (
    data: { roomId: string; newName: string },
    cb?: (resp: { success: boolean } | { error: string }) => void,
  ) => void;
  "vote:cast": (data: { roomId: string; value: number | "?" }) => void;
  "reveal:start": (data: { roomId: string }) => void;
  "vote:clear": (data: { roomId: string }) => void;
}
