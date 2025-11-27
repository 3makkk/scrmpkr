// Access Control List (ACL) and Permission Matrix for Scrum Poker Application
// Structured around RBAC core elements: Roles, Resources, Actions

import type { UserRole } from "./types";

// ===== RESOURCES =====
export type Resource = "room" | "vote" | "round" | "participant" | "session";

// ===== ACTIONS =====
export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "join"
  | "leave"
  | "cast"
  | "reveal"
  | "clear"
  | "kick"
  | "control";

// ===== PERMISSIONS (Resource:Action combinations) =====
export type Permission = `${Resource}:${Action}`;

// Valid permission combinations
export type ValidPermission =
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
  | "participant:update"
  | "participant:kick"
  | "session:control";

/**
 * RBAC Permission Matrix
 * Defines what actions each role can perform on each resource
 */
export const PERMISSION_MATRIX: Record<
  UserRole,
  Record<ValidPermission, boolean>
> = {
  owner: {
    "room:create": true,
    "room:read": true,
    "room:update": true,
    "room:delete": true,
    "room:join": true,
    "room:leave": true,
    "vote:cast": true,
    "vote:read": true,
    "round:reveal": true,
    "round:clear": true,
    "round:read": true,
    "participant:read": true,
    "participant:update": true,
    "participant:kick": true,
    "session:control": true,
  },
  participant: {
    "room:create": true,
    "room:read": true,
    "room:update": false,
    "room:delete": false,
    "room:join": true,
    "room:leave": true,
    "vote:cast": true,
    "vote:read": true,
    "round:reveal": true,
    "round:clear": true,
    "round:read": true,
    "participant:read": true,
    "participant:update": true,
    "participant:kick": false,
    "session:control": true,
  },
  visitor: {
    "room:create": true,
    "room:read": true,
    "room:update": false,
    "room:delete": false,
    "room:join": true,
    "room:leave": true,
    "vote:cast": false,
    "vote:read": true,
    "round:reveal": false,
    "round:clear": false,
    "round:read": true,
    "participant:read": true,
    "participant:update": true,
    "participant:kick": false,
    "session:control": false,
  },
};

// ===== CORE ACL BUSINESS LOGIC =====

/**
 * Core permission check function
 */
export function hasPermission(
  role: UserRole,
  permission: ValidPermission,
): boolean {
  return PERMISSION_MATRIX[role]?.[permission] ?? false;
}

/**
 * Permission context for advanced validation
 */
export interface PermissionContext {
  userRole: UserRole;
  userId: string;
  roomOwnerId?: string;
  isRoundRevealed?: boolean;
  hasVotes?: boolean;
}

/**
 * Advanced permission check with context validation
 */
export function canPerformAction(
  permission: ValidPermission,
  context: PermissionContext,
): boolean {
  const { userRole, userId, roomOwnerId } = context;

  // Base permission check
  if (!hasPermission(userRole, permission)) {
    return false;
  }

  // Additional context-based checks
  switch (permission) {
    case "room:delete":
      // Only room owner can delete room
      return userRole === "owner" && userId === roomOwnerId;

    case "participant:kick":
      // Only room owner can kick participants
      return userRole === "owner" && userId === roomOwnerId;

    default:
      return true;
  }
}

/**
 * Permission validation errors
 */
export class PermissionError extends Error {
  constructor(
    public permission: ValidPermission,
    public userRole: UserRole,
    message?: string,
  ) {
    super(
      message || `Permission '${permission}' denied for role '${userRole}'`,
    );
    this.name = "PermissionError";
  }
}

/**
 * Validate permission and throw error if not allowed
 */
export function requirePermission(
  permission: ValidPermission,
  context: PermissionContext,
): void {
  if (!canPerformAction(permission, context)) {
    throw new PermissionError(
      permission,
      context.userRole,
      `Action '${permission}' not allowed for role '${context.userRole}'`,
    );
  }
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): ValidPermission[] {
  const permissions = PERMISSION_MATRIX[role];
  if (!permissions) return [];

  return Object.entries(permissions)
    .filter(([_, allowed]) => allowed)
    .map(([permission, _]) => permission as ValidPermission);
}

/**
 * Role hierarchy for privilege escalation checks
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  visitor: 1,
  participant: 2,
  owner: 3,
};

/**
 * Check if one role has higher privileges than another
 */
export function hasHigherPrivilege(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

// ===== BUSINESS LOGIC HELPERS =====

/**
 * Business logic: Check if user can vote
 */
export function canVote(role: UserRole): boolean {
  return hasPermission(role, "vote:cast");
}

/**
 * Business logic: Check if user can control session (reveal/clear votes)
 */
export function canControlSession(role: UserRole): boolean {
  return hasPermission(role, "session:control");
}

/**
 * Business logic: Check if user can view voting results
 */
export function canViewResults(role: UserRole): boolean {
  return hasPermission(role, "round:read");
}
