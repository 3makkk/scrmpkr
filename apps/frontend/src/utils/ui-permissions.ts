// UI Logic and Display Utilities for Permission System
// Frontend-specific utilities for conditional rendering and user interface

import { type UserRole, hasPermission } from "@scrmpkr/shared";

// ===== UI PERMISSION HELPERS =====

/**
 * UI helper: Check if user interface should show voting controls
 */
export function shouldShowVotingControls(role: UserRole): boolean {
  return hasPermission(role, "vote:cast");
}

/**
 * UI helper: Check if user interface should show session controls
 */
export function shouldShowSessionControls(role: UserRole): boolean {
  return hasPermission(role, "session:control");
}
