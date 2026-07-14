import { UserRole } from "@scrmpkr/shared";

// Shared presentation data for the role dialogs (join-time RoleSelectionForm
// and the in-room "Change role" modal). Keeping title/description/icon/colors
// in one place means both dialogs look and read the same.
export type RoleOption = {
  role: UserRole;
  title: string;
  desc: string;
  icon: string;
  // Border + background when this option is the active/selected one.
  active: string;
  // Hover treatment when the option is selectable but not active.
  hover: string;
  // Icon chip colors.
  ring: string;
};

export const ROLE_OPTIONS: readonly RoleOption[] = [
  {
    role: UserRole.PARTICIPANT,
    title: "Participant",
    desc: "Vote, reveal & start rounds",
    icon: "🗳️",
    active: "border-blue-500 bg-blue-500/10",
    hover: "hover:border-blue-500/60 hover:bg-blue-500/5",
    ring: "bg-blue-500/15 text-blue-300",
  },
  {
    role: UserRole.FACILITATOR,
    title: "Facilitator",
    desc: "Reveal & start rounds, no voting",
    icon: "🎬",
    active: "border-amber-500 bg-amber-500/10",
    hover: "hover:border-amber-500/60 hover:bg-amber-500/5",
    ring: "bg-amber-500/15 text-amber-300",
  },
  {
    role: UserRole.VISITOR,
    title: "Visitor",
    desc: "Watch only, no voting or controls",
    icon: "👁",
    active: "border-purple-500 bg-purple-500/10",
    hover: "hover:border-purple-500/60 hover:bg-purple-500/5",
    ring: "bg-purple-500/15 text-purple-300",
  },
];
