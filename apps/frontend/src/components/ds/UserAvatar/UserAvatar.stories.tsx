import UserAvatar from "./UserAvatar";
import { UserRole } from "@scrmpkr/shared";

export default {
  title: "DS/UserAvatar",
  component: UserAvatar,
  args: {
    name: "John Doe",
    role: UserRole.PARTICIPANT,
  },
};

export const Owner = {
  args: {
    name: "Alice Smith",
    role: UserRole.OWNER,
  },
};

export const Participant = {
  args: {
    name: "Bob Johnson",
    role: UserRole.PARTICIPANT,
  },
};

export const Visitor = {
  args: {
    name: "Charlie Brown",
    role: UserRole.VISITOR,
  },
};

export const Small = {
  args: {
    name: "Small User",
    role: UserRole.PARTICIPANT,
    size: "sm",
  },
};

export const Medium = {
  args: {
    name: "Medium User",
    role: UserRole.PARTICIPANT,
    size: "md",
  },
};

export const Large = {
  args: {
    name: "Large User",
    role: UserRole.PARTICIPANT,
    size: "lg",
  },
};

export const Interactive = {
  args: {
    name: "Interactive User",
    role: UserRole.OWNER,
    interactive: true,
  },
};

export const WithTooltip = {
  args: {
    name: "Tooltip User",
    role: UserRole.VISITOR,
    showTooltip: true,
  },
};

export const InteractiveWithTooltip = {
  args: {
    name: "Interactive User",
    role: UserRole.OWNER,
    interactive: true,
    showTooltip: true,
  },
};

export const LongName = {
  args: {
    name: "Alexander James Christopher",
    role: UserRole.PARTICIPANT,
  },
};

export const SingleName = {
  args: {
    name: "Cher",
    role: UserRole.VISITOR,
  },
};

export const AllSizes = {
  render: () => (
    <div className="flex items-center gap-4 p-6">
      <UserAvatar name="Small User" role={UserRole.OWNER} size="sm" />
      <UserAvatar name="Medium User" role={UserRole.PARTICIPANT} size="md" />
      <UserAvatar name="Large User" role={UserRole.VISITOR} size="lg" />
    </div>
  ),
};

export const AllRoles = {
  render: () => (
    <div className="flex items-center gap-4 p-6">
      <UserAvatar name="Owner" role={UserRole.OWNER} />
      <UserAvatar name="Participant" role={UserRole.PARTICIPANT} />
      <UserAvatar name="Visitor" role={UserRole.VISITOR} />
    </div>
  ),
};
