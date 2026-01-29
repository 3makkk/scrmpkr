import { forwardRef } from "react";
import type { UIProps } from "../ds/uiTypes";
import { UserRole } from "@scrmpkr/shared";
import UserAvatar from "../ds/UserAvatar/UserAvatar";

type UserInfoSectionProps = UIProps<
  "div",
  {
    name: string;
    role: UserRole;
  }
>;

const UserInfoSection = forwardRef<HTMLDivElement, UserInfoSectionProps>(
  ({ name, role, className = "", ...props }, ref) => {
    // Get role display text
    const getRoleDisplayText = (role: UserRole) => {
      switch (role) {
        case UserRole.PARTICIPANT:
          return "Participant";
        case UserRole.VISITOR:
          return "Visitor";
        default:
          return "Unknown Role";
      }
    };

    return (
      <div
        ref={ref}
        className={`flex items-center space-x-3 ${className}`}
        {...props}
      >
        <UserAvatar name={name} role={role} size="lg" />
        <div>
          <p className="font-medium text-white">{name}</p>
          <p className="text-gray-400 text-sm">{getRoleDisplayText(role)}</p>
        </div>
      </div>
    );
  },
);

UserInfoSection.displayName = "UserInfoSection";

export default UserInfoSection;
