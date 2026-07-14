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
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-current={selected}
      data-testid={testid}
      className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
        selected
          ? `${option.active} text-white${disabled ? " cursor-default" : ""}`
          : `border-gray-600 bg-gray-800/40 text-gray-300 ${option.hover}`
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${option.ring}`}
        aria-hidden="true"
      >
        {option.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{option.title}</span>
          {badge && (
            <span
              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-200 uppercase tracking-wide"
              data-testid={`${testid}-badge`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400 text-sm">{option.desc}</div>
      </div>
    </button>
  );
}
