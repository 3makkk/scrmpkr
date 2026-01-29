import { forwardRef } from "react";
import clsx from "clsx";
import type { UIProps } from "../uiTypes";
import { UserRole } from "@scrmpkr/shared";

type UserAvatarProps = UIProps<
  "div",
  {
    name: string;
    role: UserRole;
    size?: "sm" | "md" | "lg";
    showTooltip?: boolean;
    interactive?: boolean;
  }
>;

const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    {
      name,
      role,
      size = "md",
      showTooltip = false,
      interactive = false,
      className,
      ...props
    },
    ref,
  ) => {
    // Get user initials
    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();
    };

    // Get user avatar color based on role
    const getAvatarColor = (role: UserRole) => {
      switch (role) {
        case UserRole.PARTICIPANT:
          return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
        case UserRole.VISITOR:
          return "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500";
        default:
          return "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";
      }
    };

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

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "w-6 h-6 text-xs";
        case "md":
          return "w-8 h-8 text-sm";
        case "lg":
          return "w-10 h-10 text-base";
        default:
          return "w-8 h-8 text-sm";
      }
    };

    const colorClasses = getAvatarColor(role);
    const sizeClasses = getSizeClasses();

    const title = showTooltip
      ? `${name} (${getRoleDisplayText(role)})`
      : undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          sizeClasses,
          colorClasses,
          interactive && [
            "cursor-pointer focus:outline-none focus:ring-2",
            "focus:ring-offset-2 focus:ring-offset-gray-800",
          ],
          "flex items-center justify-center rounded-full",
          "font-medium text-white transition-colors duration-200",
          className,
        )}
        title={title}
        {...props}
      >
        {getInitials(name)}
      </div>
    );
  },
);

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
