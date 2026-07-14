# Scrum Poker ACL System Documentation

Role-Based Access Control (RBAC) for the Scrum Poker app. The permission model lives in `packages/shared` so the server and frontend share one source of truth; the frontend adds a thin UI helper layer.

## File Structure

```
packages/shared/src/
├── permissions.ts          # Roles, resources, actions, matrix, and check functions
└── types.ts                # UserRole definition

apps/frontend/src/utils/
└── ui-permissions.ts       # UI helpers (shouldShowVotingControls, shouldShowSessionControls)
```

## Core Elements

### Roles

There are three roles (`packages/shared/src/types.ts`):

```typescript
type UserRole = "participant" | "visitor" | "facilitator";
```

- **Participant** — votes and controls the session (reveal, start next round, delete room).
- **Visitor** — observes only; cannot vote and cannot control the session.
- **Facilitator** — manages the session (reveal votes, start next round, delete room) but cannot cast a vote. Self-selected at join time or via the account menu. Session control is **shared** with participants, not exclusive to facilitators, so a room with zero facilitators still works.

A vote already cast survives when its caster switches to a non-voting role (facilitator or visitor) for the current round, consistent with a voter leaving the room. See `docs/adr/0001-votes-owned-by-round-tracker.md`.

There is **no "owner" role**. Room ownership is tracked separately as `RoomState.creatorId` (the userId of the room creator), not through the permission matrix.

### Resources and Actions

```typescript
type Resource = "room" | "vote" | "round" | "participant" | "session";

type Action =
  | "create" | "read" | "update" | "delete"
  | "join" | "leave" | "cast" | "reveal"
  | "clear" | "kick" | "control";
```

`Resource` and `Action` are broad type unions; the actually-used combinations are constrained by `ValidPermission`:

```typescript
type ValidPermission =
  | "room:create"
  | "room:read"
  | "room:update"
  | "room:delete"
  | "room:join"
  | "room:leave"
  | "vote:cast"
  | "vote:read"
  | "round:reveal"
  | "round:clear"
  | "round:read"
  | "participant:read"
  | "session:control";
```

## Permission Matrix

Values below are taken directly from `PERMISSION_MATRIX` in `permissions.ts`.

| Permission        | Participant | Visitor | Facilitator | Notes                          |
| ----------------- | ----------- | ------- | ----------- | ------------------------------ |
| `room:create`     | ✅          | ✅      | ✅          | Anyone can create a room       |
| `room:read`       | ✅          | ✅      | ✅          | View room information          |
| `room:update`     | ❌          | ❌      | ❌          | Not granted to any role        |
| `room:delete`     | ✅          | ❌      | ✅          | Participants and facilitators  |
| `room:join`       | ✅          | ✅      | ✅          | Anyone can join                |
| `room:leave`      | ✅          | ✅      | ✅          | Anyone can leave               |
| `vote:cast`       | ✅          | ❌      | ❌          | Only participants vote         |
| `vote:read`       | ✅          | ✅      | ✅          | View votes                     |
| `round:reveal`    | ✅          | ❌      | ✅          | Show voting results            |
| `round:clear`     | ✅          | ❌      | ✅          | Start a new round              |
| `round:read`      | ✅          | ✅      | ✅          | View round information         |
| `participant:read`| ✅          | ✅      | ✅          | View participant list          |
| `session:control` | ✅          | ❌      | ✅          | Control session flow           |

## API Reference

```typescript
// Base check against the matrix
hasPermission(role: UserRole, permission: ValidPermission): boolean

// Business-logic helpers (all thin wrappers over hasPermission)
canVote(role: UserRole): boolean            // vote:cast
canControlSession(role: UserRole): boolean  // session:control
canViewResults(role: UserRole): boolean     // round:read

// Get every allowed permission for a role
getRolePermissions(role: UserRole): ValidPermission[]

// Role hierarchy (higher number = more privilege)
ROLE_HIERARCHY: Record<UserRole, number> = { visitor: 1, facilitator: 2, participant: 2 }
hasHigherPrivilege(role1: UserRole, role2: UserRole): boolean
```

### Context-aware validation

```typescript
interface PermissionContext {
  userRole: UserRole;
  userId: string;
  isRoundRevealed?: boolean;
  hasVotes?: boolean;
}

canPerformAction(permission: ValidPermission, context: PermissionContext): boolean
requirePermission(permission: ValidPermission, context: PermissionContext): void  // throws PermissionError
```

Note: `canPerformAction` currently only performs the base matrix check via `hasPermission`. The extra `PermissionContext` fields (`isRoundRevealed`, `hasVotes`) are carried for future context-specific rules but are not yet used to grant or deny anything. If you add context rules, put them in `canPerformAction`.

## Usage

### Server-side enforcement

```typescript
import { requirePermission } from "@scrmpkr/shared";

requirePermission("vote:cast", { userRole: role, userId }); // throws if denied
```

### Frontend conditional rendering

```typescript
import {
  shouldShowVotingControls,
  shouldShowSessionControls,
} from "../utils/ui-permissions";

const canVote = shouldShowVotingControls(currentUser.role);
const canControl = shouldShowSessionControls(currentUser.role);
```

## Extending the system

1. Add the new pairing to the `ValidPermission` union in `permissions.ts`.
2. Set its value for both roles in `PERMISSION_MATRIX` (the matrix type requires every role to define every `ValidPermission`, so this is enforced by the compiler).
3. If the permission needs more than a role check, add the rule in `canPerformAction` using `PermissionContext`.
4. Add a UI helper in `ui-permissions.ts` if the frontend needs to gate rendering on it.
