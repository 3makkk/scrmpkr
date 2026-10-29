import {
  AlertIcon,
  BallotIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  FlagIcon,
} from "./Icon";

export default {
  title: "DS/Icon",
};

const icons = {
  CheckIcon,
  ClockIcon,
  FlagIcon,
  EyeIcon,
  BallotIcon,
  AlertIcon,
};

export const All = {
  render: () => (
    <div className="text-fg flex gap-6">
      {Object.entries(icons).map(([name, Icon]) => (
        <div key={name} className="flex flex-col items-center gap-2 text-xs">
          <Icon className="size-6" />
          {name}
        </div>
      ))}
    </div>
  ),
};
