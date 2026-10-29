import clsx from "clsx";
import type { UIProps } from "../uiTypes";

type IconProps = UIProps<"svg">;

// 16×16 line icons drawn with the current text colour. Decorative by default;
// pass `aria-hidden={false}` and an `aria-label` when an icon carries meaning
// on its own.
function SvgIcon({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={clsx("size-4 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 8.5l3 3 6-7" strokeWidth={2} />
    </SvgIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 1.5" />
    </SvgIcon>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8" />
    </SvgIcon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
    </SvgIcon>
  );
}

export function BallotIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="2" width="8" height="12" rx="1.5" />
    </SvgIcon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v4M8 11v.5" strokeWidth={1.6} />
    </SvgIcon>
  );
}
