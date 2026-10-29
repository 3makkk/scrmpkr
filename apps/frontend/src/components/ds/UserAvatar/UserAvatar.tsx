import { UserRole } from "@scrmpkr/shared";
import clsx from "clsx";
import { forwardRef } from "react";
import type { UIProps } from "../uiTypes";

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

    // Get role display text
    const getRoleDisplayText = (role: UserRole) => {
      switch (role) {
        case UserRole.PARTICIPANT:
          return "Participant";
        case UserRole.VISITOR:
          return "Visitor";
        case UserRole.FACILITATOR:
          return "Facilitator";
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

    const sizeClasses = getSizeClasses();

    const title = showTooltip
      ? `${name} (${getRoleDisplayText(role)})`
      : undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          sizeClasses,
          // One neutral style for every role: roles carry no colour.
          "border-line-strong flex items-center justify-center rounded-full border",
          "bg-surface-inset text-fg font-medium transition-colors duration-150",
          interactive && "hover:border-fg-muted cursor-pointer",
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
