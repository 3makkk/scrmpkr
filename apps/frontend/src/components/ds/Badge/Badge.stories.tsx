import type { Meta, StoryObj } from "@storybook/react-vite";
import Badge from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "DS/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Badge",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Basic: Story = {};

export const Colors: Story = {
  render: () => (
    <div className="space-x-3 p-6 text-white">
      <Badge>Default</Badge>
      <Badge bgClass="bg-accent">Accent</Badge>
      <Badge bgClass="bg-surface-raised">Raised</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-x-3 p-6 text-white">
      <Badge bgClass="bg-accent" className="px-2 py-0.5 text-xs">
        Small
      </Badge>
      <Badge bgClass="bg-accent" className="text-sm">
        Default
      </Badge>
      <Badge bgClass="bg-accent" className="px-4 py-2 text-base font-semibold">
        Large
      </Badge>
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    children: "Hover me",
    bgClass: "bg-surface-raised",
    title: "Helpful tooltip text",
  },
};
