# Scrum Poker ACL System Documentation

## 🏗️ **Architecture Overview**

The ACL (Access Control List) system implements Role-Based Access Control (RBAC) with clear separation between business logic and UI concerns.

### **File Structure**

```
packages/shared/src/
├── permissions.ts           # Core RBAC business logic
└── index.ts                # Shared package exports

apps/frontend/src/utils/
└── ui-permissions.ts        # Minimal UI utilities (2 functions)
```

## 🎯 **RBAC Core Elements**

### **1. Roles**

```typescript
type UserRole = "owner" | "participant" | "visitor";
```

### **2. Resources**

```typescript
type Resource = "room" | "vote" | "round" | "participant" | "session";
```

### **3. Actions**

```typescript
type Action =
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
```

### **4. Permissions (Resource:Action)**

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
  | "participant:update"
  | "participant:kick"
  | "session:control";
```

## 📊 **Permission Matrix**

| Permission                 | Owner | Participant | Visitor | Context Rules            |
| -------------------------- | ----- | ----------- | ------- | ------------------------ |
| **Room Management**        |
| `room:create`              | ✅    | ✅          | ✅      | Anyone can create rooms  |
| `room:read`                | ✅    | ✅          | ✅      | View room information    |
| `room:update`              | ✅    | ❌          | ❌      | Modify room settings     |
| `room:delete`              | ✅    | ❌          | ❌      | Only room owner          |
| `room:join`                | ✅    | ✅          | ✅      | Anyone can join          |
| `room:leave`               | ✅    | ✅          | ✅      | Anyone can leave         |
| **Voting**                 |
| `vote:cast`                | ✅    | ✅          | ❌      | Active participants only |
| `vote:read`                | ✅    | ✅          | ✅      | View voting results      |
| **Round Control**          |
| `round:reveal`             | ✅    | ✅          | ❌      | Show voting results      |
| `round:clear`              | ✅    | ✅          | ❌      | Start new round          |
| `round:read`               | ✅    | ✅          | ✅      | View round information   |
| **Participant Management** |
| `participant:read`         | ✅    | ✅          | ✅      | View participant list    |
| `participant:update`       | ✅    | ✅          | ✅      | Update own profile       |
| `participant:kick`         | ✅    | ❌          | ❌      | Only room owner          |
| **Session Control**        |
| `session:control`          | ✅    | ✅          | ❌      | Control session flow     |

## 🔧 **Core API Reference**

### **Basic Permission Checking**

```typescript
// Check if role has permission
hasPermission(role: UserRole, permission: ValidPermission): boolean

// Business logic helpers
canVote(role: UserRole): boolean
canControlSession(role: UserRole): boolean
canViewResults(role: UserRole): boolean
```

### **Context-Aware Validation**

```typescript
// Advanced permission with context
canPerformAction(permission: ValidPermission, context: PermissionContext): boolean

interface PermissionContext {
  userRole: UserRole;
  userId: string;
  roomOwnerId?: string;
  isRoundRevealed?: boolean;
  hasVotes?: boolean;
}
```

### **Permission Enforcement**

```typescript
// Validate and throw error if denied
requirePermission(permission: ValidPermission, context: PermissionContext): void

// Custom error class
class PermissionError extends Error {
  constructor(permission: ValidPermission, userRole: UserRole, message?: string)
}
```

### **Role Management**

```typescript
// Get all permissions for a role
getRolePermissions(role: UserRole): ValidPermission[]

// Role hierarchy (1=lowest, 3=highest)
ROLE_HIERARCHY: Record<UserRole, number> = {
  visitor: 1,
  participant: 2,
  owner: 3
}

// Check privilege levels
hasHigherPrivilege(role1: UserRole, role2: UserRole): boolean
```

## 💡 **Usage Examples**

### **Server-Side (Business Logic)**

```typescript
// Room management
import { canPerformAction, requirePermission } from "@scrmpkr/shared";

// Validate room deletion
const context = { userRole: "owner", userId: "123", roomOwnerId: "123" };
if (canPerformAction("room:delete", context)) {
  // Allow deletion
}

// Enforce permission with error
try {
  requirePermission("participant:kick", context);
  // Proceed with action
} catch (PermissionError) {
  // Handle denied permission
}
```

### **Frontend (UI Logic)**

```typescript
// Component conditional rendering
import {
  shouldShowVotingControls,
  shouldShowSessionControls,
} from "../utils/ui-permissions";

const canVote = shouldShowVotingControls(currentUser.role);
const canControl = shouldShowSessionControls(currentUser.role);

return (
  <>
    {canVote && <VotingDeck />}
    {canControl && <SessionControls />}
  </>
);
```

## 🔒 **Context-Based Rules**

### **Room Deletion**

- **Permission**: `room:delete`
- **Base Rule**: Only owners have this permission
- **Context Rule**: User must be the actual room owner (`userId === roomOwnerId`)

### **Participant Kicking**

- **Permission**: `participant:kick`
- **Base Rule**: Only owners have this permission
- **Context Rule**: User must be the actual room owner (`userId === roomOwnerId`)

### **Standard Permissions**

All other permissions use base permission matrix without additional context validation.

## 🧪 **Testing Strategy**

### **Permission Matrix Tests**

- Validates all role-permission combinations
- Ensures matrix completeness
- Tests permission helper functions

### **Context-Aware Tests**

- Room deletion with ownership validation
- Participant kicking with ownership validation
- Basic permission scenarios

### **Integration Tests**

- Server-side permission enforcement in room operations
- Frontend conditional rendering
- End-to-end permission flows

## 🚀 **Benefits**

### **Security**

- **Server Enforcement**: All actions validated on backend
- **Type Safety**: TypeScript prevents permission errors
- **Context Validation**: Additional checks for sensitive operations

### **Maintainability**

- **Single Source**: One permission matrix for all validations
- **Clear Structure**: Resource:Action format is self-documenting
- **Separation**: Business logic in shared, UI logic in frontend

### **Scalability**

- **Easy Extension**: Add new roles, resources, or actions
- **Consistent**: Same permission system across all features
- **Flexible**: Context rules handle complex scenarios

## 📈 **Adding New Permissions**

### **1. Add New Resource**

```typescript
type Resource =
  | "room"
  | "vote"
  | "round"
  | "participant"
  | "session"
  | "message";
```

### **2. Add New Action**

```typescript
type Action = "create" | "read" | "update" | "delete" | "send" | /* ... */;
```

### **3. Update Permission Matrix**

```typescript
export const PERMISSION_MATRIX = {
  owner: {
    // ... existing permissions
    "message:send": true,
    "message:delete": true,
  },
  participant: {
    // ... existing permissions
    "message:send": true,
    "message:delete": false,
  },
  visitor: {
    // ... existing permissions
    "message:send": false,
    "message:delete": false,
  },
};
```

### **4. Add Context Rules (if needed)**

```typescript
export function canPerformAction(
  permission: ValidPermission,
  context: PermissionContext
) {
  // ... existing logic
  switch (permission) {
    case "message:delete":
      // Only allow deleting own messages
      return context.userId === context.messageAuthorId;
    // ...
  }
}
```

The ACL system provides **enterprise-grade access control** with **clear structure**, **type safety**, and **easy extensibility** for future growth! 🎯
