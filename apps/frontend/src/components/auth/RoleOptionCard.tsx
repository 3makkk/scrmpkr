import clsx from "clsx";
import { focusRing, hoverSurface, selectedSurface } from "../ds/states";
import type { RoleOption } from "./roleOptions";

type Props = {
  readonly option: RoleOption;
  /** Active = selected (join form) or current (change-role modal). */
  readonly selected: boolean;
  /** Non-clickable, e.g. the role the user already has. */
  readonly disabled?: boolean;
  /** Small pill next to the title, e.g. "Current". */
  readonly badge?: string;
  readonly onSelect: () => void;
  readonly testid: string;
};

export default function RoleOptionCard({
  option,
  selected,
  disabled = false,
  badge,
  onSelect,
  testid,
}: Props) {
  const { Icon } = option;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-current={selected}
      data-testid={testid}
      className={clsx(
        "rounded-control flex w-full items-center gap-3 border p-4 text-left transition-colors duration-150",
        focusRing,
        selected
          ? ["border-2", selectedSurface, disabled && "cursor-default"]
          : [
              "border-line-strong text-fg-muted",
              disabled
                ? "cursor-not-allowed opacity-50"
                : [hoverSurface, "hover:border-fg-muted"],
            ],
      )}
    >
      <span
        className={clsx(
          "bg-surface-inset flex size-10 shrink-0 items-center justify-center rounded-full",
          selected ? "text-fg" : "text-fg-muted",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-fg font-medium">{option.title}</span>
          {badge && (
            <span
              className="rounded-chip bg-surface-inset text-fg px-2 py-0.5 text-[10px] tracking-wide uppercase"
              data-testid={`${testid}-badge`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-fg-muted text-sm">{option.desc}</div>
      </div>
    </button>
  );
}
