import type { UserRole } from "@scrmpkr/shared";
import clsx from "clsx";
import { CheckIcon, ClockIcon, EyeIcon, FlagIcon } from "../../ds/Icon/Icon";
import UserAvatar from "../../ds/UserAvatar/UserAvatar";
import type { UIProps } from "../../ds/uiTypes";

export type RowStatus =
  | { kind: "voted" }
  | { kind: "thinking" }
  | { kind: "revealed"; value: string | null }
  | { kind: "managing" }
  | { kind: "observing" };

type ParticipantRowProps = UIProps<
  "div",
  {
    name: string;
    displayName: string;
    role: UserRole;
    isYou: boolean;
    status: RowStatus;
    nameTestId: string;
  }
>;

// Status is always icon + text, never colour alone. Only "voted" is coloured.
function Status({ status }: { readonly status: RowStatus }) {
  switch (status.kind) {
    case "voted":
      return (
        <span className="text-success flex items-center gap-1">
          <CheckIcon />
          voted
        </span>
      );
    case "thinking":
      return (
        <span className="flex items-center gap-1">
          <ClockIcon />
          thinking
        </span>
      );
    case "managing":
      return (
        <span className="flex items-center gap-1">
          <FlagIcon />
          managing
        </span>
      );
    case "observing":
      return (
        <span className="flex items-center gap-1">
          <EyeIcon />
          observing
        </span>
      );
    case "revealed":
      return (
        <span className="rounded-chip bg-surface-inset text-fg px-2 py-0.5 font-medium">
          {status.value ?? "—"}
        </span>
      );
  }
}

export default function ParticipantRow({
  name,
  displayName,
  role,
  isYou,
  status,
  nameTestId,
  className,
  ...props
}: ParticipantRowProps) {
  return (
    <div
      className={clsx(
        "rounded-control flex items-center gap-3 px-2 py-2",
        isYou && "bg-surface-hover",
        className,
      )}
      {...props}
    >
      <UserAvatar name={name} role={role} size="sm" />
      <span
        className="text-fg min-w-0 flex-1 truncate text-sm"
        data-testid={nameTestId}
      >
        {displayName}
      </span>
      <span className="text-fg-muted shrink-0 text-xs">
        <Status status={status} />
      </span>
    </div>
  );
}
