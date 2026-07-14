# Facilitator Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third `facilitator` user role that can manage a voting session (reveal, start next round, delete room) but cannot cast votes, and allow users to switch roles mid-session.

**Architecture:** The app is role-keyed throughout. A new `facilitator` `UserRole` slots into the existing `PERMISSION_MATRIX` as "participant minus `vote:cast`". Session control stays shared (participants keep it). A new self-service `user:updateRole` socket event mirrors `user:updateName`; it changes `participant.role` only and never touches an already-cast vote, so the existing "a cast vote survives in the round tracker" behavior carries over unchanged. Vote counting across the UI is switched from "not a visitor" to the `canVote(role)` helper so facilitators are excluded like visitors.

**Tech Stack:** TypeScript monorepo (pnpm workspaces). `packages/shared` (types + permissions), `apps/server` (Socket.IO, Vitest tests in `apps/server/__tests__`), `apps/frontend` (React + Tailwind), `apps/e2e` (Playwright).

## Global Constraints

- Commit with: `git -c commit.gpgsign=false commit --no-gpg-sign -m "..."`. Never plain `git commit`, never `--no-verify`.
- Role name is exactly `facilitator` (lowercase).
- Session control is SHARED: do NOT remove any permission from the `participant` row.
- Exclude non-voters from vote counts by reusing `canVote(role)` from `@scrmpkr/shared` — never hardcode `role !== "visitor"` or role-name string checks for counting.
- A role change MUST NOT clear `hasVoted` or `value` and MUST NOT touch the round tracker.
- `user:updateRole` is self-service: no permission gate, no transition restrictions.
- After each code change, check LSP/typecheck diagnostics and fix errors before moving on. `UserRole` is a const object; `PERMISSION_MATRIX` and `ROLE_HIERARCHY` are `Record<UserRole, ...>`, so a missing `facilitator` entry is a compile error by design — let it guide completeness.

---

### Task 1: Shared types, permission matrix, and event contract

**Files:**
- Modify: `packages/shared/src/types.ts:3-8` (UserRole const + type), `packages/shared/src/types.ts:48-72` (ClientToServerEvents)
- Modify: `packages/shared/src/permissions.ts:46-80` (PERMISSION_MATRIX), `packages/shared/src/permissions.ts:168-171` (ROLE_HIERARCHY)
- Test: `apps/server/__tests__/permissions.test.ts`

**Interfaces:**
- Produces: `UserRole.FACILITATOR = "facilitator"`; `PERMISSION_MATRIX.facilitator` row; `ROLE_HIERARCHY.facilitator`; `"user:updateRole"` client event `(data: { roomId: string; newRole: UserRole }, cb?: (resp: { success: boolean } | { error: string }) => void) => void`.

- [ ] **Step 1: Write the failing tests** in `apps/server/__tests__/permissions.test.ts`

Add `"facilitator"` to the `roles` array in the existing `"should define permissions for all roles"` test (line 19), and append these new `it` blocks inside the `"Permission Matrix"` describe:

```typescript
it("should grant correct permissions to facilitator", () => {
  expect(hasPermission("facilitator", "room:create")).toBe(true);
  expect(hasPermission("facilitator", "room:delete")).toBe(true);
  expect(hasPermission("facilitator", "vote:cast")).toBe(false);
  expect(hasPermission("facilitator", "vote:read")).toBe(true);
  expect(hasPermission("facilitator", "round:reveal")).toBe(true);
  expect(hasPermission("facilitator", "round:clear")).toBe(true);
  expect(hasPermission("facilitator", "round:read")).toBe(true);
  expect(hasPermission("facilitator", "session:control")).toBe(true);
  expect(hasPermission("facilitator", "participant:read")).toBe(true);
  expect(hasPermission("facilitator", "room:update")).toBe(false);
});
```

Add to the `"Helper Functions"` describe:

```typescript
it("should exclude facilitator from voting but allow control", () => {
  expect(canVote("facilitator")).toBe(false);
  expect(canControlSession("facilitator")).toBe(true);
  expect(canViewResults("facilitator")).toBe(true);
});
```

Add to the `"Role Hierarchy"` describe (facilitator sits above visitor, below participant — an arbitrary but defined level; hierarchy is not used for enforcement here, only completeness):

```typescript
it("should define a hierarchy level for facilitator", () => {
  expect(ROLE_HIERARCHY.facilitator).toBe(2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @scrmpkr/server test -- permissions`
Expected: FAIL — TypeScript errors that `"facilitator"` is not assignable to `UserRole`, and assertion failures.

- [ ] **Step 3: Add the role to `packages/shared/src/types.ts`**

Replace the `UserRole` const (lines 3-6):

```typescript
export const UserRole = {
  PARTICIPANT: "participant",
  VISITOR: "visitor",
  FACILITATOR: "facilitator",
} as const;
```

Add the `user:updateRole` event to `ClientToServerEvents` (after the `user:updateName` block, around line 68):

```typescript
  "user:updateRole": (
    data: { roomId: string; newRole: UserRole },
    cb?: (resp: { success: boolean } | { error: string }) => void,
  ) => void;
```

- [ ] **Step 4: Add the facilitator row to `packages/shared/src/permissions.ts`**

Inside `PERMISSION_MATRIX`, after the `visitor` block (line 79), add:

```typescript
  facilitator: {
    "room:create": true,
    "room:read": true,
    "room:update": false,
    "room:delete": true,
    "room:join": true,
    "room:leave": true,
    "vote:cast": false,
    "vote:read": true,
    "round:reveal": true,
    "round:clear": true,
    "round:read": true,
    "participant:read": true,
    "session:control": true,
  },
```

Add the hierarchy entry to `ROLE_HIERARCHY` (line 168-171):

```typescript
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  visitor: 1,
  facilitator: 2,
  participant: 2,
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @scrmpkr/server test -- permissions`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/permissions.ts apps/server/__tests__/permissions.test.ts
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(shared): add facilitator role to permission matrix and event contract"
```

---

### Task 2: Server-side role change (Room + RoomManager)

**Files:**
- Modify: `apps/server/src/room.ts` (add `updateParticipantRole` method after `updateParticipantName`, around line 73)
- Modify: `apps/server/src/roomManager.ts` (add `updateParticipantRole` after `updateParticipantName`, around line 279)
- Test: `apps/server/__tests__/roomManager.test.ts`

**Interfaces:**
- Consumes: `UserRole` from `@scrmpkr/shared`.
- Produces: `Room.updateParticipantRole(userId: string, newRole: UserRole): boolean`; `RoomManager.updateParticipantRole(roomId: string, userId: string, newRole: UserRole): boolean`. Both return `false` when the participant is not found, `true` otherwise. Neither touches `hasVoted`, `value`, or the round tracker.

- [ ] **Step 1: Write the failing tests** — append to `apps/server/__tests__/roomManager.test.ts`

```typescript
describe("updateParticipantRole", () => {
  it("changes a participant's role", () => {
    const manager = new RoomManager();
    manager.createRoom("role-room", { id: "u1", name: "Alice" }, "participant");
    const ok = manager.updateParticipantRole("role-room", "u1", "facilitator");
    expect(ok).toBe(true);
    const state = manager.getState("role-room");
    expect(state?.participants.find((p) => p.id === "u1")?.role).toBe(
      "facilitator",
    );
  });

  it("keeps an already-cast vote when switching to a non-voting role", () => {
    const manager = new RoomManager();
    manager.createRoom("role-room", { id: "u1", name: "Alice" }, "participant");
    manager.castVote("role-room", "u1", 5);
    manager.updateParticipantRole("role-room", "u1", "facilitator");
    const state = manager.getState("role-room");
    // Participant flag stays voted and the round tracker still holds the vote.
    expect(state?.participants.find((p) => p.id === "u1")?.hasVoted).toBe(true);
    expect(state?.currentRoundState.votes.find((v) => v.id === "u1")?.value).toBe(
      5,
    );
  });

  it("returns false for an unknown participant", () => {
    const manager = new RoomManager();
    manager.createRoom("role-room", { id: "u1", name: "Alice" }, "participant");
    expect(manager.updateParticipantRole("role-room", "ghost", "visitor")).toBe(
      false,
    );
  });

  it("returns false for an unknown room", () => {
    const manager = new RoomManager();
    expect(manager.updateParticipantRole("nope", "u1", "visitor")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @scrmpkr/server test -- roomManager`
Expected: FAIL — `updateParticipantRole` is not a function.

- [ ] **Step 3: Add `updateParticipantRole` to `apps/server/src/room.ts`**

After `updateParticipantName` (ends line 73):

```typescript
  updateParticipantRole(userId: string, newRole: UserRole): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    // Only the role changes. hasVoted / value and the round tracker are left
    // untouched: a vote already cast survives in the current round exactly as
    // it does when a voter leaves.
    participant.role = newRole;
    return true;
  }
```

- [ ] **Step 4: Add `updateParticipantRole` to `apps/server/src/roomManager.ts`**

After `updateParticipantName` (ends line 279):

```typescript
  updateParticipantRole(
    roomId: string,
    userId: string,
    newRole: UserRole,
  ): boolean {
    const normalizedId = this.normalizeRoomId(roomId);
    const roomLogger = logger.child({ roomId: normalizedId, userId });
    const room = this.rooms.get(normalizedId);
    if (!room) {
      roomLogger.warn("Update participant role was rejected, room not found");
      return false;
    }

    const success = room.updateParticipantRole(userId, newRole);
    if (!success) {
      roomLogger.warn(
        "Update participant role was rejected, participant not found",
      );
      return false;
    }

    roomLogger.info({ newRole }, "Participant role was updated");
    return true;
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @scrmpkr/server test -- roomManager`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/room.ts apps/server/src/roomManager.ts apps/server/__tests__/roomManager.test.ts
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(server): add updateParticipantRole preserving cast votes"
```

---

### Task 3: Server socket handler for `user:updateRole`

**Files:**
- Modify: `apps/server/src/index.ts:24-44` (local `ClientToServerEvents` interface) and add a handler after the `user:updateName` handler (ends line 206)

**Interfaces:**
- Consumes: `RoomManager.updateParticipantRole` (Task 2).
- Produces: socket event `user:updateRole` that updates the role and broadcasts fresh `room:state`.

- [ ] **Step 1: Add the event to the local `ClientToServerEvents` interface** in `apps/server/src/index.ts`

After the `user:updateName` entry (line 40), add:

```typescript
  "user:updateRole": (
    data: { roomId: string; newRole: UserRole },
    cb?: (resp: { success: boolean } | { error: string }) => void,
  ) => void;
```

(`UserRole` is already imported at line 8.)

- [ ] **Step 2: Add the handler** after the `user:updateName` handler (after line 206)

```typescript
  socket.on("user:updateRole", ({ roomId, newRole }, cb) => {
    const roomLogger = userLogger.child({ roomId, newRole });
    try {
      const success = rooms.updateParticipantRole(
        roomId,
        socket.data.user.id,
        newRole,
      );
      if (success) {
        const state = rooms.getState(roomId);
        if (state) namespace.to(state.id).emit("room:state", state);
        if (cb) cb({ success: true });
      } else {
        roomLogger.warn("Role update failed - user not in room");
        if (cb) cb({ error: "User not found in room" });
      }
    } catch (error) {
      const e = error as Error;
      roomLogger.error({ error: e.message }, "Role update failed");
      if (cb) cb({ error: e.message });
    }
  });
```

- [ ] **Step 3: Typecheck and build the server**

Run: `pnpm --filter @scrmpkr/server typecheck` (or `pnpm --filter @scrmpkr/server build`)
Expected: no type errors.

- [ ] **Step 4: Run the full server test suite**

Run: `pnpm --filter @scrmpkr/server test`
Expected: PASS (no regressions).

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/index.ts
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(server): handle user:updateRole socket event"
```

---

### Task 4: Frontend vote-count and display fixes (exclude facilitators)

Fix every place that counts voters or renders role so facilitators are treated as non-voters (like visitors) and shown with their own badge. This must land before the join/switch UI so a facilitator never inflates a denominator.

**Files:**
- Modify: `apps/frontend/src/hooks/useRoom.tsx:112-119` (votedCount / allVoted)
- Modify: `apps/frontend/src/components/room/controls/StateAwareSessionControls.tsx:22-31`
- Modify: `apps/frontend/src/components/room/status/ContextualTeamStatus.tsx:14-18,62-69`

**Interfaces:**
- Consumes: `canVote` from `@scrmpkr/shared`.
- Produces: counting keyed on `canVote(role)`; a "🎬 Facilitator" role label; facilitators excluded from the "Active Participants" voter list.

- [ ] **Step 1: Fix `useRoom.tsx` counts**

Add `canVote` to the shared import (line 11-16 imports from `@scrmpkr/shared`; add a value import — note the current import is `import type`, so add a separate value import line):

```typescript
import { canVote } from "@scrmpkr/shared";
```

Replace lines 112-119:

```typescript
  const voters = roomState
    ? roomState.participants.filter((participant) => canVote(participant.role))
    : [];
  const votedCount = voters.filter((participant) => participant.hasVoted).length;
  const allVoted = voters.length > 0 && voters.every((p) => p.hasVoted);
```

- [ ] **Step 2: Fix `StateAwareSessionControls.tsx` counts**

Add to the shared import (line 3): change `import { UserRole } from "@scrmpkr/shared";` to `import { canVote } from "@scrmpkr/shared";` (the `UserRole` import is only used at line 24 for the visitor filter, which we are replacing — remove it if no longer referenced).

Replace lines 23-31:

```typescript
  // Only voters (participant role) count toward the reveal denominator.
  const activeParticipants = roomState.participants.filter((p) =>
    canVote(p.role),
  );
  const votedActiveParticipants = activeParticipants.filter(
    (p) => p.hasVoted,
  ).length;
  const allActiveVoted =
    activeParticipants.length > 0 &&
    activeParticipants.every((p) => p.hasVoted);
```

- [ ] **Step 3: Fix `ContextualTeamStatus.tsx` counts and role label**

Replace lines 14-18 (keep `visitors` for the separate section, but base the voter list on `canVote`, and separate facilitators from the voter list):

```typescript
  // Voters (participant role) are the "Active Participants" list.
  const activeParticipants = participants.filter((p) => canVote(p.role));
  const visitors = participants.filter((p) => p.role === UserRole.VISITOR);
  const facilitators = participants.filter(
    (p) => p.role === UserRole.FACILITATOR,
  );
  const votedActiveParticipants = activeParticipants.filter(
    (p) => p.hasVoted,
  ).length;
```

Add `canVote` to the imports at line 3:

```typescript
import { type Participant, UserRole, canVote } from "@scrmpkr/shared";
```

Extend `getRoleDisplay` (lines 62-69) to label facilitators:

```typescript
  const getRoleDisplay = (participant: Participant) => {
    switch (participant.role) {
      case UserRole.VISITOR:
        return "👁 Visitor";
      case UserRole.FACILITATOR:
        return "🎬 Facilitator";
      default:
        return "";
    }
  };
```

Render facilitators in their own section. After the Visitors section block (after line 169, before the closing `</div>` at line 170), add:

```tsx
        {/* Facilitators - non-voting session managers */}
        {facilitators.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-400 text-sm uppercase tracking-wider">
              Facilitators (
              <span data-testid="facilitator-count">{facilitators.length}</span>)
            </h3>
            <div className="flex flex-wrap gap-2 lg:block lg:space-y-3">
              {facilitators.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex w-auto animate-slide-in-left items-center justify-between rounded-lg border border-amber-700/40 bg-amber-900/20 p-3 lg:w-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`facilitator-${participant.name}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <div className="flex flex-col">
                      <span
                        className={`font-medium text-sm ${
                          participant.id === account.id
                            ? "text-amber-400"
                            : "text-gray-300"
                        }`}
                        data-testid={`facilitator-name-${participant.name}`}
                      >
                        {participant.id === account.id
                          ? "You"
                          : participant.name}
                        <span className="ml-1 text-amber-500 text-xs">🎬</span>
                      </span>
                      <span className="text-gray-500 text-xs">managing</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
```

- [ ] **Step 4: Typecheck the frontend and fix role-exhaustiveness**

Run: `pnpm --filter @scrmpkr/frontend typecheck`
Expected: no errors. If typecheck flags a `switch` on `UserRole` or a role-keyed object missing `facilitator` (likely candidates: `apps/frontend/src/components/ds/UserAvatar/UserAvatar.tsx` and `apps/frontend/src/components/auth/UserInfoSection.tsx`), add a `facilitator` case there mirroring how `visitor` is handled (amber accent, "Facilitator" label). Re-run until clean.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/hooks/useRoom.tsx apps/frontend/src/components/room/controls/StateAwareSessionControls.tsx apps/frontend/src/components/room/status/ContextualTeamStatus.tsx
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(frontend): exclude facilitators from vote counts and show facilitator section"
```

---

### Task 5: Join-time facilitator option in `RoleSelectionForm`

**Files:**
- Modify: `apps/frontend/src/components/auth/RoleSelectionForm.tsx` (add a third radio option after the Visitor label, ends line 85)

**Interfaces:**
- Consumes: `UserRole.FACILITATOR`.
- Produces: a selectable facilitator option with `data-testid="role-facilitator-option"` / `role-facilitator-radio`. `onJoin` already accepts any `UserRole`, so no signature change.

- [ ] **Step 1: Add the facilitator radio option** after the Visitor `<label>` block (after line 85)

```tsx
            <label className="animation-delay-350 block animate-fade-in-scale">
              <input
                type="radio"
                name="role"
                value={UserRole.FACILITATOR}
                checked={selectedRole === UserRole.FACILITATOR}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="sr-only"
                data-testid="role-facilitator-radio"
              />
              <div
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedRole === UserRole.FACILITATOR
                    ? "border-amber-500 bg-amber-500/10 text-white"
                    : "border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
                data-testid="role-facilitator-option"
              >
                <div className="mb-1 font-medium">Facilitator</div>
                <div className="text-gray-400 text-sm">
                  Manage the session (reveal and start rounds) without voting
                </div>
              </div>
            </label>
```

- [ ] **Step 2: Typecheck the frontend**

Run: `pnpm --filter @scrmpkr/frontend typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/auth/RoleSelectionForm.tsx
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(frontend): offer facilitator role at join time"
```

---

### Task 6: In-room role switch (self-service) via the account menu

Reuse the account menu (where the user edits their own name) as the entry point, and reuse `RoleSelectionForm`'s option UI inside a modal. Wire a new `updateRole` action through `useRoom`.

**Files:**
- Modify: `apps/frontend/src/hooks/useRoom.tsx` (add `updateRole` to `RoomContextValue` and implement it; ~lines 79-96 for the type, add callback near `castVote` ~line 223, add to `contextValue` ~line 248)
- Modify: `apps/frontend/src/components/auth/AccountIndicator.tsx` (add a "Change role" menu button + a modal reusing role options)

**Interfaces:**
- Consumes: socket event `user:updateRole` (Task 3); `RoleSelectionForm` option markup.
- Produces: `useRoom().updateRole(newRole: UserRole): void`.

- [ ] **Step 1: Add `updateRole` to `useRoom.tsx`**

In `RoomContextValue` (after `clearVotes: () => void;`, line 95) add:

```typescript
  updateRole: (newRole: UserRole) => void;
```

Add the callback after `clearVotes` (after line 246):

```typescript
  const updateRole = useCallback(
    (newRole: UserRole) => {
      const socket = socketRef.current;
      if (socket && currentRoomId) {
        socket.emit("user:updateRole", { roomId: currentRoomId, newRole });
      }
    },
    [currentRoomId],
  );
```

Add `updateRole` to the `contextValue` object (after `clearVotes,`, line 260).

- [ ] **Step 2: Add the "Change role" control to `AccountIndicator.tsx`**

Add state near the existing `useState` calls (after line 16):

```typescript
  const [isEditingRole, setIsEditingRole] = useState(false);
  const { updateRole } = useRoom();
```

(`useRoom` is already imported; extend the existing destructure at line 14 to include `updateRole` instead of adding a second call — i.e. `const { currentRoomId, roomState, updateRole } = useRoom();` and drop the extra line above.)

Add handlers after `handleChangeUsername` (after line 59):

```typescript
  const handleChangeRole = () => {
    setIsMenuOpen(false);
    setIsEditingRole(true);
  };

  const handleRoleSelected = (newRole: UserRole) => {
    updateRole(newRole);
    setIsEditingRole(false);
  };
```

Add a menu button after the "Change username" button (after line 101, still inside the dropdown `<div>`):

```tsx
          <button
            type="button"
            onClick={handleChangeRole}
            className="w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm transition-colors duration-150 hover:bg-gray-700 hover:text-white"
            data-testid="change-role-button"
          >
            Change role
          </button>
```

Add a role-edit modal after the username Modal (after line 126). Reuse the same three radio options as `RoleSelectionForm`; render them inline against the current role:

```tsx
      <Modal
        open={isEditingRole}
        onClose={() => setIsEditingRole(false)}
        data-testid="role-edit-overlay"
      >
        <Card className="w-md">
          <div className="mb-6">
            <h2 className="mb-2 font-medium text-2xl text-white">Change Role</h2>
            <p className="text-gray-400">
              Switch how you take part in this session
            </p>
          </div>
          <div className="space-y-3">
            {(
              [
                {
                  role: UserRole.PARTICIPANT,
                  title: "Participant",
                  desc: "Vote in planning sessions and see results",
                  testid: "role-option-participant",
                },
                {
                  role: UserRole.FACILITATOR,
                  title: "Facilitator",
                  desc: "Manage the session (reveal and start rounds) without voting",
                  testid: "role-option-facilitator",
                },
                {
                  role: UserRole.VISITOR,
                  title: "Visitor",
                  desc: "Observe the session without voting",
                  testid: "role-option-visitor",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.role}
                type="button"
                onClick={() => handleRoleSelected(opt.role)}
                data-testid={opt.testid}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  userRole === opt.role
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
              >
                <div className="mb-1 font-medium">{opt.title}</div>
                <div className="text-gray-400 text-sm">{opt.desc}</div>
              </button>
            ))}
          </div>
        </Card>
      </Modal>
```

- [ ] **Step 3: Typecheck the frontend**

Run: `pnpm --filter @scrmpkr/frontend typecheck`
Expected: no errors.

- [ ] **Step 4: Build the frontend to confirm no runtime import cycles**

Run: `pnpm --filter @scrmpkr/frontend build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/hooks/useRoom.tsx apps/frontend/src/components/auth/AccountIndicator.tsx
git -c commit.gpgsign=false commit --no-gpg-sign -m "feat(frontend): allow switching role mid-session from the account menu"
```

---

### Task 7: End-to-end test for the facilitator role

**Files:**
- Modify: `apps/e2e/domain-objects/TestUser.ts` (`selectRole` — accept `"FACILITATOR"`)
- Modify: `apps/e2e/domain-objects/TestRoom.ts` (`addUser` role union — accept `"FACILITATOR"`)
- Create: `apps/e2e/tests/facilitator-role.spec.ts`

**Interfaces:**
- Consumes: `data-testid="role-facilitator-option"` (Task 5), `data-testid="facilitator-count"` (Task 4), `data-testid="reveal-votes-button"` (existing).

- [ ] **Step 1: Extend `selectRole` in `apps/e2e/domain-objects/TestUser.ts`**

Change the signature and add the branch (mirror the existing visitor branch):

```typescript
  async selectRole(role: "PARTICIPANT" | "VISITOR" | "FACILITATOR") {
    await this.page.waitForSelector(
      '[data-testid="role-selection-join-button"]',
      {},
    );

    if (role === "VISITOR") {
      await this.page.click('[data-testid="role-visitor-option"]');
    } else if (role === "FACILITATOR") {
      await this.page.click('[data-testid="role-facilitator-option"]');
    } else {
      await this.page.click('[data-testid="role-participant-option"]');
    }
    await this.page.click('[data-testid="role-selection-join-button"]');
  }
```

- [ ] **Step 2: Widen the `addUser` role union in `apps/e2e/domain-objects/TestRoom.ts`**

Change the `role` parameter type from `"PARTICIPANT" | "VISITOR"` to `"PARTICIPANT" | "VISITOR" | "FACILITATOR"` (both in the parameter and in the `TestParticipation` construction).

- [ ] **Step 3: Write the e2e test** `apps/e2e/tests/facilitator-role.spec.ts`

Model it on `visitor-role.spec.ts`. Cover: a facilitator joins, does NOT see the voting deck, a participant votes, the facilitator can reveal, and the facilitator is counted separately.

```typescript
import { test } from "@playwright/test";
import { TestUser } from "../domain-objects/TestUser";
import { TestRoom } from "../domain-objects/TestRoom";
import { UserAssertions, RoomAssertions } from "../domain-objects/test-assertions";

test("facilitator manages the session without voting", async ({ browser }) => {
  const facilitator = await TestUser.create(browser, "Facil");
  const voter = await TestUser.create(browser, "Voter");
  let room: TestRoom;

  await test.step("facilitator creates room and joins as facilitator", async () => {
    await facilitator.navigateToHome();
    await facilitator.fillLoginForm();
    room = await TestRoom.createByUser(
      facilitator,
      `facilitator-test-room-${Date.now()}`,
    );
    await room.addUser(facilitator, "FACILITATOR");
  });

  await test.step("facilitator does not see the voting deck", async () => {
    await UserAssertions.for(facilitator).shouldNotSeeVotingDeck();
  });

  await test.step("participant joins and votes", async () => {
    await voter.navigateToHome();
    await voter.fillLoginForm();
    await room.addUser(voter, "PARTICIPANT");
    await RoomAssertions.for(room).shouldHaveFacilitatorCount(facilitator, 1);
    await voter.page.click('[data-testid="card-5"]');
  });

  await test.step("facilitator can reveal votes", async () => {
    await facilitator.page.click('[data-testid="reveal-votes-button"]');
    await facilitator.page.waitForSelector('[data-testid="clear-votes-button"]');
  });
});
```

- [ ] **Step 4: Add the `shouldHaveFacilitatorCount` assertion**

In `apps/e2e/domain-objects/test-assertions.ts`, add to `RoomAssertions` (mirror the existing `shouldHaveVisitorCount`, which reads `[data-testid="visitor-count"]`):

```typescript
  async shouldHaveFacilitatorCount(user: TestUser, count: number) {
    await expect(
      user.page.locator('[data-testid="facilitator-count"]'),
    ).toHaveText(String(count));
  }
```

Verify the exact card testid (`card-5`) and the `shouldNotSeeVotingDeck` helper exist by opening `visitor-role.spec.ts` and `test-assertions.ts`; adjust selectors to match the real ones if they differ.

- [ ] **Step 5: Run the e2e suite for this spec**

Run: `pnpm --filter @scrmpkr/e2e test -- facilitator-role`
Expected: PASS. (If Playwright browsers are not installed, run `pnpm --filter @scrmpkr/e2e exec playwright install` first.)

- [ ] **Step 6: Commit**

```bash
git add apps/e2e/domain-objects/TestUser.ts apps/e2e/domain-objects/TestRoom.ts apps/e2e/domain-objects/test-assertions.ts apps/e2e/tests/facilitator-role.spec.ts
git -c commit.gpgsign=false commit --no-gpg-sign -m "test(e2e): cover facilitator role join, no-vote, and reveal"
```

---

### Task 8: Document the facilitator role

**Files:**
- Modify: `docs/ACL_DOCUMENTATION.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update `docs/ACL_DOCUMENTATION.md`**

Add `facilitator` to the roles list and the permission matrix table so the doc matches `PERMISSION_MATRIX`. Describe it in plain English: "Facilitator — manages the session (reveal votes, start next round, delete room) but cannot cast a vote. Self-selected at join time or via the account menu; session control is shared with participants, not exclusive." Note the behavior that a vote already cast survives a switch to a non-voting role for the current round (consistent with a voter leaving).

- [ ] **Step 2: Commit**

```bash
git add docs/ACL_DOCUMENTATION.md
git -c commit.gpgsign=false commit --no-gpg-sign -m "docs: document the facilitator role in the ACL reference"
```

---

## Notes on behavior (decided during design)

- **Shared control, not exclusive.** Participants keep reveal/clear so a room with zero facilitators still works. A facilitator is *a* non-voting manager, not the *sole* one.
- **No cap on facilitators.** Zero or many are allowed; self-selected, no promotion mechanism.
- **Vote survives a role switch.** Switching to a non-voting role after voting keeps the vote in the current round tracker (see `Room.recordVote` storing into `currentRoundTracker`, and `removeParticipant` never touching it). This can produce `X/N`-style totals where a vote outlives its caster's voter status — the same accepted skew that already occurs when a voter leaves. No special handling.
- **All-non-voter room cannot reveal.** With no participant-role voters, `votedActiveParticipants` is 0 and reveal stays disabled. Correct, not a bug.
</content>
</invoke>
