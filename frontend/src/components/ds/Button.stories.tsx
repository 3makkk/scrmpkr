import Button from "./Button";

export default {
  title: "DS/Button",
  component: Button,
  args: { children: "Button" },
};

export const Primary = {
  args: { variant: "primary" },
};

export const Secondary = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Danger = {
  args: { variant: "danger", children: "Danger" },
};

export const Disabled = {
  args: { disabled: true },
};
