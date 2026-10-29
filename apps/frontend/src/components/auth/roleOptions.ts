import { UserRole } from "@scrmpkr/shared";
import type React from "react";
import { BallotIcon, EyeIcon, FlagIcon } from "../ds/Icon/Icon";
import type { UIProps } from "../ds/uiTypes";

// Shared presentation data for the role dialogs (join-time RoleSelectionForm
// and the in-room "Change role" modal). Keeping title/description/icon in one
// place means both dialogs look and read the same. Roles carry no colour.
export type RoleOption = {
  role: UserRole;
  title: string;
  desc: string;
  Icon: (props: UIProps<"svg">) => React.JSX.Element;
};

export const ROLE_OPTIONS: readonly RoleOption[] = [
  {
    role: UserRole.PARTICIPANT,
    title: "Participant",
    desc: "Vote, reveal & start rounds",
    Icon: BallotIcon,
  },
  {
    role: UserRole.FACILITATOR,
    title: "Facilitator",
    desc: "Reveal & start rounds, no voting",
    Icon: FlagIcon,
  },
  {
    role: UserRole.VISITOR,
    title: "Visitor",
    desc: "Watch only, no voting or controls",
    Icon: EyeIcon,
  },
];
