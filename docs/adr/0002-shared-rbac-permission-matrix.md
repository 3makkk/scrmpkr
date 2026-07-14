# Authorization is a role-keyed permission matrix in the shared package

Access control is expressed as a single RBAC matrix (`PERMISSION_MATRIX` in
`packages/shared/src/permissions.ts`) mapping each `UserRole` to a fixed set of
resource:action permissions. Both the server (which enforces) and the frontend
(which gates UI) import the same matrix and helpers (`hasPermission`,
`canVote`, `canControlSession`), so there is one source of truth for who can do
what.

We chose this over duplicating permission logic per app, or scattering
role checks inline, so that server enforcement and frontend UI gating can never
drift apart: adding or changing a role is a single edit to the matrix, and
TypeScript's `Record<UserRole, ...>` typing forces every role to define every
permission.

## Consequences

- New roles (e.g. `facilitator`) are added by editing the matrix once; the
  compiler flags any role-keyed structure that forgot the new role.
- UI code must derive gating from the shared helpers (e.g. `canVote(role)`),
  not from hardcoded role-name comparisons, or it will silently diverge from
  the enforced rules when roles change.
- Authorization is purely role-based today; identity-based authority (e.g.
  room-owner privileges via `creatorId`) is not part of this model.
</content>
