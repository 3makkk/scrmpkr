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
    <div className="p-6 text-white space-x-3">
      <Badge bgClass="bg-blue-600">Blue</Badge>
      <Badge bgClass="bg-purple-600">Purple</Badge>
      <Badge bgClass="bg-green-600">Green</Badge>
      <Badge bgClass="bg-rose-600">Rose</Badge>
      <Badge bgClass="bg-gray-900/70">Translucent</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="p-6 text-white space-x-3">
      <Badge bgClass="bg-blue-600" className="text-xs px-2 py-0.5">
        Small
      </Badge>
      <Badge bgClass="bg-blue-600" className="text-sm">
        Default
      </Badge>
      <Badge
        bgClass="bg-blue-600"
        className="text-base px-4 py-2 font-semibold"
      >
        Large
      </Badge>
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    children: "Hover me",
    bgClass: "bg-gray-900/70",
    title: "Helpful tooltip text",
  },
};
