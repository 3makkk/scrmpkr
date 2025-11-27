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
      const roles: UserRole[] = ["owner", "participant", "visitor"];
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
        "participant:update",
        "participant:kick",
        "session:control",
      ];

      roles.forEach((role) => {
        expect(PERMISSION_MATRIX[role]).toBeDefined();
        permissions.forEach((permission) => {
          expect(PERMISSION_MATRIX[role][permission]).toBeDefined();
        });
      });
    });

    it("should grant correct permissions to owner", () => {
      expect(hasPermission("owner", "room:create")).toBe(true);
      expect(hasPermission("owner", "room:delete")).toBe(true);
      expect(hasPermission("owner", "vote:cast")).toBe(true);
      expect(hasPermission("owner", "round:reveal")).toBe(true);
      expect(hasPermission("owner", "round:clear")).toBe(true);
      expect(hasPermission("owner", "participant:kick")).toBe(true);
      expect(hasPermission("owner", "session:control")).toBe(true);
    });

    it("should grant correct permissions to participant", () => {
      expect(hasPermission("participant", "room:create")).toBe(true);
      expect(hasPermission("participant", "room:delete")).toBe(false);
      expect(hasPermission("participant", "vote:cast")).toBe(true);
      expect(hasPermission("participant", "round:reveal")).toBe(true);
      expect(hasPermission("participant", "round:clear")).toBe(true);
      expect(hasPermission("participant", "participant:kick")).toBe(false);
      expect(hasPermission("participant", "session:control")).toBe(true);
    });

    it("should grant correct permissions to visitor", () => {
      expect(hasPermission("visitor", "room:create")).toBe(true);
      expect(hasPermission("visitor", "room:delete")).toBe(false);
      expect(hasPermission("visitor", "vote:cast")).toBe(false);
      expect(hasPermission("visitor", "round:reveal")).toBe(false);
      expect(hasPermission("visitor", "round:clear")).toBe(false);
      expect(hasPermission("visitor", "participant:kick")).toBe(false);
      expect(hasPermission("visitor", "session:control")).toBe(false);
      expect(hasPermission("visitor", "round:read")).toBe(true);
      expect(hasPermission("visitor", "participant:read")).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    it("should correctly identify who can vote", () => {
      expect(canVote("owner")).toBe(true);
      expect(canVote("participant")).toBe(true);
      expect(canVote("visitor")).toBe(false);
    });

    it("should correctly identify who can control session", () => {
      expect(canControlSession("owner")).toBe(true);
      expect(canControlSession("participant")).toBe(true);
      expect(canControlSession("visitor")).toBe(false);
    });

    it("should correctly identify who can view results", () => {
      expect(canViewResults("owner")).toBe(true);
      expect(canViewResults("participant")).toBe(true);
      expect(canViewResults("visitor")).toBe(true);
    });
  });

  describe("Role Hierarchy", () => {
    it("should define correct hierarchy levels", () => {
      expect(ROLE_HIERARCHY.visitor).toBe(1);
      expect(ROLE_HIERARCHY.participant).toBe(2);
      expect(ROLE_HIERARCHY.owner).toBe(3);
    });

    it("should correctly compare privilege levels", () => {
      expect(hasHigherPrivilege("owner", "participant")).toBe(true);
      expect(hasHigherPrivilege("owner", "visitor")).toBe(true);
      expect(hasHigherPrivilege("participant", "visitor")).toBe(true);
      expect(hasHigherPrivilege("participant", "owner")).toBe(false);
      expect(hasHigherPrivilege("visitor", "participant")).toBe(false);
      expect(hasHigherPrivilege("visitor", "owner")).toBe(false);
    });
  });

  describe("Context-aware Permissions", () => {
    const ownerContext: PermissionContext = {
      userRole: "owner",
      userId: "owner123",
      roomOwnerId: "owner123",
    };

    const participantContext: PermissionContext = {
      userRole: "participant",
      userId: "user456",
      roomOwnerId: "owner123",
    };

    const visitorContext: PermissionContext = {
      userRole: "visitor",
      userId: "visitor789",
      roomOwnerId: "owner123",
    };

    it("should allow room deletion only for room owner", () => {
      expect(canPerformAction("room:delete", ownerContext)).toBe(true);
      expect(canPerformAction("room:delete", participantContext)).toBe(false);
      expect(canPerformAction("room:delete", visitorContext)).toBe(false);
    });

    it("should allow participant kicking only for room owner", () => {
      expect(canPerformAction("participant:kick", ownerContext)).toBe(true);
      expect(canPerformAction("participant:kick", participantContext)).toBe(
        false,
      );
      expect(canPerformAction("participant:kick", visitorContext)).toBe(false);
    });

    it("should handle basic permissions correctly", () => {
      expect(canPerformAction("vote:cast", ownerContext)).toBe(true);
      expect(canPerformAction("vote:cast", participantContext)).toBe(true);
      expect(canPerformAction("vote:cast", visitorContext)).toBe(false);
    });
  });
});
