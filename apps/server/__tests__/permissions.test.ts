import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canVote,
  canControlSession,
  canViewResults,
  canPerformAction,
  hasHigherPrivilege,
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  type UserRole,
  type ValidPermission,
  type PermissionContext,
} from "@scrmpkr/shared";

describe("Permission System (ACL)", () => {
  describe("Permission Matrix", () => {
    it("should define permissions for all roles", () => {
      const roles: UserRole[] = ["participant", "visitor"];
      const permissions: ValidPermission[] = [
        "room:create",
        "room:read",
        "room:update",
        "room:delete",
        "room:join",
        "room:leave",
        "vote:cast",
        "vote:read",
        "round:reveal",
        "round:clear",
        "round:read",
        "participant:read",
        "session:control",
      ];

      roles.forEach((role) => {
        expect(PERMISSION_MATRIX[role]).toBeDefined();
        permissions.forEach((permission) => {
          expect(PERMISSION_MATRIX[role][permission]).toBeDefined();
        });
      });
    });

    it("should grant correct permissions to participant", () => {
      expect(hasPermission("participant", "room:create")).toBe(true);
      expect(hasPermission("participant", "room:delete")).toBe(true);
      expect(hasPermission("participant", "vote:cast")).toBe(true);
      expect(hasPermission("participant", "round:reveal")).toBe(true);
      expect(hasPermission("participant", "round:clear")).toBe(true);
      expect(hasPermission("participant", "session:control")).toBe(true);
    });

    it("should grant correct permissions to visitor", () => {
      expect(hasPermission("visitor", "room:create")).toBe(true);
      expect(hasPermission("visitor", "room:delete")).toBe(false);
      expect(hasPermission("visitor", "vote:cast")).toBe(false);
      expect(hasPermission("visitor", "round:reveal")).toBe(false);
      expect(hasPermission("visitor", "round:clear")).toBe(false);
      expect(hasPermission("visitor", "session:control")).toBe(false);
      expect(hasPermission("visitor", "round:read")).toBe(true);
      expect(hasPermission("visitor", "participant:read")).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    it("should correctly identify who can vote", () => {
      expect(canVote("participant")).toBe(true);
      expect(canVote("visitor")).toBe(false);
    });

    it("should correctly identify who can control session", () => {
      expect(canControlSession("participant")).toBe(true);
      expect(canControlSession("visitor")).toBe(false);
    });

    it("should correctly identify who can view results", () => {
      expect(canViewResults("participant")).toBe(true);
      expect(canViewResults("visitor")).toBe(true);
    });
  });

  describe("Role Hierarchy", () => {
    it("should define correct hierarchy levels", () => {
      expect(ROLE_HIERARCHY.visitor).toBe(1);
      expect(ROLE_HIERARCHY.participant).toBe(2);
    });

    it("should correctly compare privilege levels", () => {
      expect(hasHigherPrivilege("participant", "visitor")).toBe(true);
      expect(hasHigherPrivilege("visitor", "participant")).toBe(false);
    });
  });

  describe("Context-aware Permissions", () => {
    const participantContext: PermissionContext = {
      userRole: "participant",
      userId: "user456",
    };

    const visitorContext: PermissionContext = {
      userRole: "visitor",
      userId: "visitor789",
    };

    it("should allow room deletion only for room owner", () => {
      expect(canPerformAction("room:delete", participantContext)).toBe(true);
      expect(canPerformAction("room:delete", visitorContext)).toBe(false);
    });

    it("should handle basic permissions correctly", () => {
      expect(canPerformAction("vote:cast", participantContext)).toBe(true);
      expect(canPerformAction("vote:cast", visitorContext)).toBe(false);
    });
  });
});
