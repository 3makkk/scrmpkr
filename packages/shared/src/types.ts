// Core types for the Scrum Poker app

export const UserRole = {
  PARTICIPANT: "participant",
  VISITOR: "visitor",
  FACILITATOR: "facilitator",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

const USER_ROLES: readonly string[] = Object.values(UserRole);

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value);

export const MAX_NAME_LENGTH = 100;

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

// The server tracks which room a socket has joined, so in-room events don't
// carry a roomId.
export interface ClientToServerEvents {
  "room:exists": (
    data: { roomId: string },
    cb: (resp: { exists: boolean }) => void,
  ) => void;
  "room:join": (
    data: { roomId: string; role?: UserRole },
    cb: (resp: { state: RoomState } | { error: string }) => void,
  ) => void;
  "room:leave": (cb?: (resp: { success: boolean }) => void) => void;
  "user:updateName": (
    data: { newName: string },
    cb?: (resp: { success: boolean } | { error: string }) => void,
  ) => void;
  "user:updateRole": (
    data: { newRole: UserRole },
    cb?: (resp: { success: boolean } | { error: string }) => void,
  ) => void;
  "vote:cast": (data: { value: number | "?" }) => void;
  "reveal:start": () => void;
  "vote:clear": () => void;
}
